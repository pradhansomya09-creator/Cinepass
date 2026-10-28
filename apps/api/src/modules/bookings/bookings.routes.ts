import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/db';
import {
  BookingCreateSchema,
  BookingCancelSchema,
  BookingStatus,
  SeatStatus,
  DiscountType,
  PaymentStatus,
} from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import paymentGateway from '../../utils/razorpay';
import emailService from '../../utils/email';

const router = Router();

// POST /api/v1/bookings (Create pending booking from active seat hold)
router.post('/', authenticate, validateBody(BookingCreateSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { showId, seatHoldId, couponCode } = req.body;
  const userId = req.user!.userId;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Verify seat hold
      const hold = await tx.seatHold.findUnique({
        where: { id: seatHoldId },
        include: {
          items: {
            include: { seat: true },
          },
        },
      });

      if (!hold) {
        throw new Error('Seat hold session has expired or is invalid. Please select seats again.');
      }

      if (hold.userId !== userId) {
        throw new Error('This seat hold session does not belong to you');
      }

      if (new Date(hold.expiresAt) <= new Date()) {
        throw new Error('Seat hold duration has expired. Please select your seats again.');
      }

      if (hold.showId !== showId) {
        throw new Error('Show mismatch with seat hold session');
      }

      const seatIds = hold.items.map((i) => i.seatId);

      // 2. Fetch show seat pricing from DB
      const showSeats = await tx.showSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
        include: { seat: true },
      });

      if (showSeats.length !== seatIds.length) {
        throw new Error('Could not find all selected seats in the auditorium');
      }

      // 3. Compute subtotal directly on server
      const totalAmount = showSeats.reduce((acc, curr) => acc + Number(curr.price), 0);
      let discountAmount = 0;
      let validCoupon: any = null;

      // 4. Validate coupon if provided
      if (couponCode) {
        validCoupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        if (validCoupon && validCoupon.isActive) {
          const now = new Date();
          if (now >= new Date(validCoupon.validFrom) && now <= new Date(validCoupon.validUntil)) {
            if (
              validCoupon.currentUsageCount < validCoupon.globalUsageLimit &&
              totalAmount >= Number(validCoupon.minBookingAmount)
            ) {
              const redemptions = await tx.couponRedemption.count({
                where: { couponId: validCoupon.id, userId },
              });

              if (redemptions < validCoupon.perUserUsageLimit) {
                if (validCoupon.discountType === DiscountType.PERCENTAGE) {
                  discountAmount = (totalAmount * Number(validCoupon.discountValue)) / 100;
                  if (validCoupon.maxDiscountAmount && discountAmount > Number(validCoupon.maxDiscountAmount)) {
                    discountAmount = Number(validCoupon.maxDiscountAmount);
                  }
                } else {
                  discountAmount = Math.min(Number(validCoupon.discountValue), totalAmount);
                }
              }
            }
          }
        }
      }

      discountAmount = Math.round(discountAmount * 100) / 100;
      const finalAmount = Math.max(0, totalAmount - discountAmount);

      const bookingRef = 'CP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      // 5. Create Booking in PENDING state
      const createdBooking = await tx.booking.create({
        data: {
          bookingReference: bookingRef,
          userId,
          showId,
          totalAmount,
          discountAmount,
          finalAmount,
          status: BookingStatus.PENDING,
          couponCode: validCoupon ? validCoupon.code : null,
          seats: {
            create: showSeats.map((ss) => ({
              seatId: ss.seatId,
              price: ss.price,
              category: ss.seat.category,
            })),
          },
        },
        include: {
          seats: { include: { seat: true } },
          show: {
            include: {
              movie: true,
              screen: { include: { cinema: true } },
            },
          },
        },
      });

      // 6. Create Razorpay Payment Order (or sandbox mock order)
      const rzpOrder = await paymentGateway.createOrder({
        amount: Math.round(finalAmount * 100), // in paise
        currency: 'INR',
        receipt: createdBooking.bookingReference,
        notes: {
          bookingId: createdBooking.id,
          userId,
          showId,
        },
      });

      // 7. Store Payment record in CREATED state
      await tx.payment.create({
        data: {
          bookingId: createdBooking.id,
          razorpayOrderId: rzpOrder.id,
          amount: finalAmount,
          currency: 'INR',
          status: PaymentStatus.CREATED,
        },
      });

      return {
        booking: createdBooking,
        razorpayOrder: rzpOrder,
      };
    });

    return sendSuccess(
      res,
      {
        bookingId: booking.booking.id,
        bookingReference: booking.booking.bookingReference,
        totalAmount: Number(booking.booking.totalAmount),
        discountAmount: Number(booking.booking.discountAmount),
        finalAmount: Number(booking.booking.finalAmount),
        seats: booking.booking.seats.map((s) => ({
          label: `${s.seat.rowLabel}${s.seat.seatNumber}`,
          category: s.category,
          price: Number(s.price),
        })),
        movie: {
          title: booking.booking.show.movie.title,
          posterUrl: booking.booking.show.movie.posterUrl,
        },
        cinema: {
          name: booking.booking.show.screen.cinema.name,
          screenName: booking.booking.show.screen.name,
        },
        showTime: booking.booking.show.startTime,
        payment: {
          orderId: booking.razorpayOrder.id,
          keyId: paymentGateway.getPublicKey(),
          amount: booking.razorpayOrder.amount,
          currency: booking.razorpayOrder.currency,
          isSandbox: paymentGateway.isSandbox(),
        },
      },
      'Booking initiated. Complete payment to confirm.',
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to initiate booking', 400);
  }
});

// GET /api/v1/bookings (Get authenticated user's bookings)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const where: any = { userId };
  if (status) {
    where.status = status;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      seats: { include: { seat: true } },
      ticket: true,
      payment: true,
      show: {
        include: {
          movie: true,
          screen: { include: { cinema: { include: { city: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = bookings.map((b) => ({
    id: b.id,
    bookingReference: b.bookingReference,
    status: b.status,
    totalAmount: Number(b.totalAmount),
    discountAmount: Number(b.discountAmount),
    finalAmount: Number(b.finalAmount),
    couponCode: b.couponCode,
    cancellationReason: b.cancellationReason,
    cancelledAt: b.cancelledAt,
    createdAt: b.createdAt,
    movie: {
      id: b.show.movie.id,
      title: b.show.movie.title,
      posterUrl: b.show.movie.posterUrl,
      durationMinutes: b.show.movie.durationMinutes,
      ageClassification: b.show.movie.ageClassification,
    },
    cinema: {
      name: b.show.screen.cinema.name,
      address: b.show.screen.cinema.address,
      city: b.show.screen.cinema.city.name,
      screenName: b.show.screen.name,
    },
    showTime: b.show.startTime,
    seats: b.seats.map((s) => ({
      label: `${s.seat.rowLabel}${s.seat.seatNumber}`,
      category: s.category,
      price: Number(s.price),
    })),
    ticket: b.ticket
      ? {
          id: b.ticket.id,
          ticketNumber: b.ticket.ticketNumber,
          isRedeemed: b.ticket.isRedeemed,
        }
      : null,
    payment: b.payment
      ? {
          status: b.payment.status,
          method: b.payment.method,
        }
      : null,
    isEligibleForCancellation:
      b.status === BookingStatus.CONFIRMED &&
      new Date(b.show.startTime).getTime() - Date.now() > 2 * 60 * 60 * 1000, // 2 hours policy
  }));

  return sendSuccess(res, formatted);
});

// GET /api/v1/bookings/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === 'ADMIN';

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      seats: { include: { seat: true } },
      ticket: true,
      payment: true,
      show: {
        include: {
          movie: true,
          screen: { include: { cinema: { include: { city: true } } } },
        },
      },
    },
  });

  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  if (booking.userId !== userId && !isAdmin) {
    return sendError(res, 'Unauthorized access to this booking', 403);
  }

  return sendSuccess(res, {
    ...booking,
    totalAmount: Number(booking.totalAmount),
    discountAmount: Number(booking.discountAmount),
    finalAmount: Number(booking.finalAmount),
    isEligibleForCancellation:
      booking.status === BookingStatus.CONFIRMED &&
      new Date(booking.show.startTime).getTime() - Date.now() > 2 * 60 * 60 * 1000,
  });
});

// POST /api/v1/bookings/:id/cancel (Cancellation & refund workflow)
router.post('/:id/cancel', authenticate, validateBody(BookingCancelSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === 'ADMIN';

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      seats: true,
      show: { include: { movie: true } },
      payment: true,
      user: true,
    },
  });

  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  if (booking.userId !== userId && !isAdmin) {
    return sendError(res, 'Unauthorized to cancel this booking', 403);
  }

  if (booking.status !== BookingStatus.CONFIRMED) {
    return sendError(res, `Cannot cancel booking in ${booking.status} status`, 400);
  }

  // 2 hours cancellation rule
  const hoursRemaining = (new Date(booking.show.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursRemaining < 2 && !isAdmin) {
    return sendError(res, 'Bookings can only be cancelled at least 2 hours before the showtime', 400);
  }

  // Execute atomic cancellation, seat release, and refund record creation
  const cancelledResult = await prisma.$transaction(async (tx) => {
    // 1. Release seats back to AVAILABLE
    const seatIds = booking.seats.map((s) => s.seatId);
    await tx.showSeat.updateMany({
      where: {
        showId: booking.showId,
        seatId: { in: seatIds },
      },
      data: {
        status: SeatStatus.AVAILABLE,
        bookingSeatId: null,
      },
    });

    // 2. Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: BookingStatus.CANCELLED,
        cancellationReason: reason,
        cancelledAt: new Date(),
      },
    });

    // 3. Update payment status & create refund record if paid
    if (booking.payment && booking.payment.status === PaymentStatus.SUCCESS) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.REFUND_PENDING },
      });

      await tx.refund.create({
        data: {
          paymentId: booking.payment.id,
          bookingId: booking.id,
          amount: booking.finalAmount,
          reason,
          status: 'REFUND_INITIATED',
          razorpayRefundId: 'rfnd_mock_' + crypto.randomBytes(8).toString('hex'),
        },
      });
    }

    return updatedBooking;
  });

  return sendSuccess(
    res,
    cancelledResult,
    'Booking cancelled successfully. Your refund has been initiated to original payment source.'
  );
});

export default router;
