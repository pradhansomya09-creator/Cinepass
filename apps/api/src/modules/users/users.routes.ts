import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../config/db';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits').optional(),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// GET /api/v1/users/profile
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isEmailVerified: true,
      createdAt: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  return sendSuccess(res, user);
});

// PATCH /api/v1/users/profile
router.patch('/profile', authenticate, validateBody(UpdateProfileSchema), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { name, phone } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name, phone },
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

  return sendSuccess(res, updated, 'Profile updated successfully');
});

// PATCH /api/v1/users/password
router.patch('/password', authenticate, validateBody(ChangePasswordSchema), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return sendError(res, 'User not found', 404);
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return sendError(res, 'Current password does not match', 400);
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  return sendSuccess(res, null, 'Password changed successfully');
});

export default router;
