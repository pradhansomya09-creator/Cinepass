import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/db';
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  UserRole,
} from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} from '../../utils/jwt';
import { sendSuccess, sendError } from '../../utils/response';
import emailService from '../../utils/email';

const router = Router();

// POST /register
router.post('/register', authLimiter, validateBody(RegisterSchema), async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return sendError(res, 'An account with this email address already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verifyToken = crypto.randomBytes(32).toString('hex');

  const user = await prisma.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: UserRole.USER,
      emailVerifyToken: verifyToken,
      isEmailVerified: true, // auto-verified in dev/demo mode for friction-free testing
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  const tokenPayload = { userId: user.id, email: user.email, role: user.role as UserRole };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(res, { user, accessToken }, 'Registration successful', 201);
});

// POST /login
router.post('/login', authLimiter, validateBody(LoginSchema), async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const tokenPayload = { userId: user.id, email: user.email, role: user.role as UserRole };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  setAuthCookies(res, accessToken, refreshToken);

  return sendSuccess(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      accessToken,
    },
    'Login successful'
  );
});

// POST /logout
router.post('/logout', (req: Request, res: Response) => {
  clearAuthCookies(res);
  return sendSuccess(res, null, 'Logged out successfully');
});

// GET /me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, { user });
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    return sendError(res, 'Refresh token required', 401);
  }

  try {
    const payload = verifyRefreshToken(token);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      clearAuthCookies(res);
      return sendError(res, 'Refresh token invalid or expired', 401);
    }

    const tokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role as UserRole,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    setAuthCookies(res, newAccessToken);

    return sendSuccess(res, { accessToken: newAccessToken });
  } catch (err) {
    clearAuthCookies(res);
    return sendError(res, 'Invalid refresh token', 401);
  }
});

// POST /forgot-password
router.post('/forgot-password', authLimiter, validateBody(ForgotPasswordSchema), async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: resetExpiry,
      },
    });

    await emailService.sendPasswordReset(user.email, resetToken);
  }

  // Always return success to prevent email enumeration
  return sendSuccess(res, null, 'If that email address exists in our system, password reset instructions have been sent.');
});

// POST /reset-password
router.post('/reset-password', authLimiter, validateBody(ResetPasswordSchema), async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return sendError(res, 'Invalid or expired password reset token', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return sendSuccess(res, null, 'Password has been reset successfully. You can now log in.');
});

export default router;
