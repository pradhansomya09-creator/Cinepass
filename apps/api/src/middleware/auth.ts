import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { UserRole } from '@movie-booking/shared';
import prisma from '../config/db';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { name?: string };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to HttpOnly cookie
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
        code: 'UNAUTHORIZED',
      });
    }

    const payload = verifyAccessToken(token);

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, isEmailVerified: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists',
        code: 'USER_NOT_FOUND',
      });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.',
      code: 'TOKEN_EXPIRED',
    });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
  } catch (err) {
    // optional auth failure is non-fatal
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You do not have permission to perform this action',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}
