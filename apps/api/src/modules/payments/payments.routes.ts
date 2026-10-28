import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/db';
import {
  PaymentVerifySchema,
  BookingStatus,
  PaymentStatus,
  SeatStatus,
} from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import paymentGateway from '../../utils/razorpay';
import emailService from '../../utils/email';

const router = Router();

// POST /api/v1/payments/verify (Backend cryptographic signature verification & booking confirmation)
router.post('/verify', authenticate, validateBody(PaymentVerifySchema), async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const userId = req.user!.userId;

  // 1. Cryptographically verify signature
  const isSignatureValid = paymentGateway.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isSignatureValid) {
    return sendError(res, 'Payment verification failed: Invalid cryptographic signature', 400);
  }

  // 2. Fetch booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      seats: { include: { seat: true } },
      payment: true,
      user: true,
      show: {
        include: {
          movie: true,
          screen: { include: { cinema: true } },
        },
      },
    },
  });

  if (!booking) {
    return sendError(res, 'Booking not found', 404);
  }

  if (booking.userId !== userId && req.user!.role !== 'ADMIN') {
    return sendError(res, 'Unauthorized access to booking payment', 403);
  }

  // Idempotency: If already confirmed, return existing confirmation safely
  if (booking.status === BookingStatus.CONFIRMED) {
    const existingTicket = await prisma.ticket.findUnique({ where: { bookingId } });
    return sendSuccess(
      res,
      {
        bookingId: booking.id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        ticket: existingTicket,
      },
      'Booking already verified and confirmed'
    );
  }

  // 3. Atomically confirm booking, allocate seats, redeem coupon, and generate ticket
  try {
    const confirmedData = await prisma.$transaction(async (tx) => {
      // A. Update Payment status
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: PaymentStatus.SUCCESS,
          method: 'Razorpay UPI/Card',
        },
      });

      // B. Update Booking status to CONFIRMED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
        },
      });

      // C. Permanently allocate seats in ShowSeat
      for (const bs of booking.seats) {
        await tx.showSeat.update({
          where: {
            showId_seatId: {
              showId: booking.showId,
              seatId: bs.seatId,
            },
          },
          data: {
            status: SeatStatus.BOOKED,
            bookingSeatId: bs.id,
          },
        });
      }

      // D. Record coupon redemption if coupon was applied
      if (booking.couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: booking.couponCode } });
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { currentUsageCount: { increment: 1 } },
          });

          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              userId: booking.userId,
              bookingId: booking.id,
              discountApplied: booking.discountAmount,
            },
          });
        }
      }

      // E. Generate electronic ticket with opaque anti-counterfeit QR token
      const ticketNumber = 'TKT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
      const qrToken = 'CINEPASS_' + crypto.randomBytes(16).toString('hex').toUpperCase();

      const ticket = await tx.ticket.create({
        data: {
          bookingId: booking.id,
          ticketNumber,
          qrToken,
          isRedeemed: false,
        },
      });

      // F. Delete any temporary seat hold for this user & show
      const hold = await tx.seatHold.findFirst({
        where: { showId: booking.showId, userId: booking.userId },
      });
      if (hold) {
        await tx.seatHoldItem.deleteMany({ where: { seatHoldId: hold.id } });
        await tx.seatHold.delete({ where: { id: hold.id } });
      }

      return {
        booking: updatedBooking,
        ticket,
      };
    });

    // 4. Send transactional confirmation email in background
    const seatLabels = booking.seats.map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', ');
    emailService.sendBookingConfirmation(booking.user.email, {
      bookingRef: booking.bookingReference,
      movieTitle: booking.show.movie.title,
      cinemaName: booking.show.screen.cinema.name,
      screenName: booking.show.screen.name,
      showTime: new Date(booking.show.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      seats: seatLabels,
      amount: Number(booking.finalAmount),
    }).catch(err => console.error('Email error:', err));

    return sendSuccess(
      res,
      {
        bookingId: confirmedData.booking.id,
        bookingReference: confirmedData.booking.bookingReference,
        status: confirmedData.booking.status,
        ticket: confirmedData.ticket,
      },
      'Payment verified successfully. Booking confirmed!'
    );
  } catch (error: any) {
    console.error('Error confirming booking post-payment:', error);
    return sendError(res, 'Failed to complete booking confirmation: ' + error.message, 500);
  }
});

// POST /api/v1/payments/webhook (Razorpay Webhook Handler)
router.post('/webhook', async (req: Request, res: Response) => {
  const webhookSignature = req.headers['x-razorpay-signature'] as string;
  const rawBody = JSON.stringify(req.body);

  if (!webhookSignature) {
    return sendError(res, 'Missing webhook signature', 400);
  }

  const isValid = paymentGateway.verifyWebhookSignature(rawBody, webhookSignature);
  if (!isValid) {
    return sendError(res, 'Invalid webhook signature', 400);
  }

  const event = req.body.event;
  console.log(`[PAYMENT WEBHOOK EVENT RECEIVED]: ${event}`);

  if (event === 'payment.captured') {
    const paymentEntity = req.body.payload?.payment?.entity;
    if (paymentEntity && paymentEntity.order_id) {
      const paymentRecord = await prisma.payment.findUnique({
        where: { razorpayOrderId: paymentEntity.order_id },
      });

      if (paymentRecord && paymentRecord.status !== PaymentStatus.SUCCESS) {
        await prisma.payment.update({
          where: { id: paymentRecord.id },
          data: {
            status: PaymentStatus.SUCCESS,
            razorpayPaymentId: paymentEntity.id,
          },
        });
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
});

export default router;
