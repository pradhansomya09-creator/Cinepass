import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { CouponValidateSchema, CouponCreateSchema, DiscountType, UserRole } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// POST /api/v1/coupons/validate (Validate coupon code and compute discount)
router.post('/validate', authenticate, validateBody(CouponValidateSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { code, subtotal } = req.body;
  const userId = req.user!.userId;

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    return sendError(res, 'Invalid or expired coupon code', 400);
  }

  const now = new Date();
  if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
    return sendError(res, 'This coupon is not valid at this time', 400);
  }

  if (coupon.currentUsageCount >= coupon.globalUsageLimit) {
    return sendError(res, 'Coupon usage limit has been reached', 400);
  }

  if (subtotal < Number(coupon.minBookingAmount)) {
    return sendError(
      res,
      `Coupon requires a minimum booking amount of ₹${Number(coupon.minBookingAmount)}`,
      400
    );
  }

  // Check user usage limit
  const userRedemptions = await prisma.couponRedemption.count({
    where: { couponId: coupon.id, userId },
  });

  if (userRedemptions >= coupon.perUserUsageLimit) {
    return sendError(res, 'You have already used this coupon the maximum allowed number of times', 400);
  }

  // Calculate discount
  let discount = 0;
  if (coupon.discountType === DiscountType.PERCENTAGE) {
    discount = (subtotal * Number(coupon.discountValue)) / 100;
    if (coupon.maxDiscountAmount && discount > Number(coupon.maxDiscountAmount)) {
      discount = Number(coupon.maxDiscountAmount);
    }
  } else {
    discount = Math.min(Number(coupon.discountValue), subtotal);
  }

  discount = Math.round(discount * 100) / 100;
  const finalAmount = Math.max(0, subtotal - discount);

  return sendSuccess(res, {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: Number(coupon.discountValue),
    discountAmount: discount,
    subtotal,
    finalAmount,
  }, 'Coupon applied successfully');
});

// GET /api/v1/coupons (Admin list all coupons)
router.get('/', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return sendSuccess(res, coupons);
});

// POST /api/v1/coupons (Admin create coupon)
router.post('/', authenticate, requireRole(UserRole.ADMIN), validateBody(CouponCreateSchema), async (req: Request, res: Response) => {
  const data = req.body;
  const coupon = await prisma.coupon.create({
    data: {
      code: data.code.toUpperCase(),
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minBookingAmount: data.minBookingAmount || 0,
      maxDiscountAmount: data.maxDiscountAmount,
      globalUsageLimit: data.globalUsageLimit || 100,
      perUserUsageLimit: data.perUserUsageLimit || 1,
      validFrom: new Date(data.validFrom),
      validUntil: new Date(data.validUntil),
      isActive: data.isActive ?? true,
    },
  });
  return sendSuccess(res, coupon, 'Coupon created successfully', 201);
});

// PATCH /api/v1/coupons/:id (Admin toggle/update coupon)
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;
  const coupon = await prisma.coupon.update({
    where: { id },
    data,
  });
  return sendSuccess(res, coupon, 'Coupon updated successfully');
});

// DELETE /api/v1/coupons/:id (Admin delete coupon)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.coupon.delete({ where: { id } });
  return sendSuccess(res, null, 'Coupon deleted successfully');
});

export default router;
