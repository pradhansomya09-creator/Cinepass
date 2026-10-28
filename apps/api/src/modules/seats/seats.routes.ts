import { Router, Response } from 'express';
import crypto from 'crypto';
import prisma from '../../config/db';
import { SeatHoldSchema, SeatStatus } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { config } from '../../config';

const router = Router();

// POST /api/v1/seats/holds (Create temporary seat hold with atomic lock)
router.post('/holds', authenticate, validateBody(SeatHoldSchema), async (req: AuthenticatedRequest, res: Response) => {
  const { showId, seatIds } = req.body;
  const userId = req.user!.userId;

  try {
    const holdDurationMinutes = config.seatHoldDurationMinutes;
    const expiresAt = new Date(Date.now() + holdDurationMinutes * 60 * 1000);
    const holdToken = 'HOLD_' + crypto.randomBytes(16).toString('hex');

    // Execute atomic seat hold inside a database transaction
    const seatHold = await prisma.$transaction(async (tx) => {
      // 1. Re-validate show exists and is active
      const show = await tx.show.findUnique({
        where: { id: showId, isActive: true },
      });

      if (!show) {
        throw new Error('Show does not exist or has ended');
      }

      // 2. Fetch current status of all requested seats for this show
      const currentShowSeats = await tx.showSeat.findMany({
        where: {
          showId,
          seatId: { in: seatIds },
        },
        include: { seat: true },
      });

      if (currentShowSeats.length !== seatIds.length) {
        throw new Error('Some requested seats could not be found for this auditorium');
      }

      // 3. Concurrency check: Ensure every seat is currently AVAILABLE
      const unavailableSeats = currentShowSeats.filter((ss) => ss.status !== SeatStatus.AVAILABLE);

      if (unavailableSeats.length > 0) {
        const labels = unavailableSeats.map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', ');
        throw new Error(`Seats ${labels} are no longer available. Please select other seats.`);
      }

      // 4. Update seat statuses atomically to HELD
      await tx.showSeat.updateMany({
        where: {
          showId,
          seatId: { in: seatIds },
          status: SeatStatus.AVAILABLE,
        },
        data: {
          status: SeatStatus.HELD,
        },
      });

      // 5. Create SeatHold record
      const hold = await tx.seatHold.create({
        data: {
          showId,
          userId,
          token: holdToken,
          expiresAt,
          items: {
            create: seatIds.map((sId: string) => ({ seatId: sId })),
          },
        },
        include: {
          items: {
            include: { seat: true },
          },
        },
      });

      return {
        hold,
        seats: currentShowSeats,
      };
    });

    // Calculate subtotal
    const subtotal = seatHold.seats.reduce((acc, curr) => acc + Number(curr.price), 0);

    return sendSuccess(
      res,
      {
        seatHoldId: seatHold.hold.id,
        token: seatHold.hold.token,
        expiresAt: seatHold.hold.expiresAt,
        showId,
        seats: seatHold.seats.map((s) => ({
          seatId: s.seatId,
          rowLabel: s.seat.rowLabel,
          seatNumber: s.seat.seatNumber,
          category: s.seat.category,
          price: Number(s.price),
        })),
        subtotal,
      },
      `Seats held for ${config.seatHoldDurationMinutes} minutes`,
      201
    );
  } catch (error: any) {
    return sendError(res, error.message || 'Failed to hold seats. Please try again.', 409);
  }
});

// GET /api/v1/seats/holds/:id (Check hold status & time remaining)
router.get('/holds/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const hold = await prisma.seatHold.findUnique({
    where: { id },
    include: {
      items: { include: { seat: true } },
      show: { include: { movie: true, screen: { include: { cinema: true } } } },
    },
  });

  if (!hold) {
    return sendError(res, 'Seat hold session not found or expired', 404);
  }

  const isExpired = new Date(hold.expiresAt) <= new Date();

  return sendSuccess(res, {
    id: hold.id,
    token: hold.token,
    showId: hold.showId,
    expiresAt: hold.expiresAt,
    isExpired,
    secondsRemaining: Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)),
    movieTitle: hold.show.movie.title,
    cinemaName: hold.show.screen.cinema.name,
    seats: hold.items.map((i) => ({
      seatId: i.seatId,
      label: `${i.seat.rowLabel}${i.seat.seatNumber}`,
      category: i.seat.category,
    })),
  });
});

// DELETE /api/v1/seats/holds/:id (Release hold on demand)
router.delete('/holds/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const hold = await prisma.seatHold.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!hold) {
    return sendSuccess(res, null, 'Hold already released');
  }

  // Ensure only the user who created it or admin can release it
  if (hold.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    return sendError(res, 'Unauthorized to release this seat hold', 403);
  }

  await prisma.$transaction(async (tx) => {
    const seatIds = hold.items.map((i) => i.seatId);

    // Revert seats to AVAILABLE if they are still in HELD status
    await tx.showSeat.updateMany({
      where: {
        showId: hold.showId,
        seatId: { in: seatIds },
        status: SeatStatus.HELD,
      },
      data: {
        status: SeatStatus.AVAILABLE,
      },
    });

    await tx.seatHoldItem.deleteMany({ where: { seatHoldId: hold.id } });
    await tx.seatHold.delete({ where: { id: hold.id } });
  });

  return sendSuccess(res, null, 'Seats released back to pool');
});

export default router;
