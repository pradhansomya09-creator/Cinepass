import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { ShowCreateSchema, UserRole, SeatCategory, SeatStatus } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET /api/v1/shows
router.get('/', async (req: Request, res: Response) => {
  const movieId = typeof req.query.movieId === 'string' ? req.query.movieId : undefined;
  const cinemaId = typeof req.query.cinemaId === 'string' ? req.query.cinemaId : undefined;
  const cityId = typeof req.query.cityId === 'string' ? req.query.cityId : undefined;
  const dateStr = typeof req.query.date === 'string' ? req.query.date : undefined; // YYYY-MM-DD

  const where: any = { isActive: true };

  if (movieId) where.movieId = movieId;

  if (cinemaId) {
    where.screen = { cinemaId };
  } else if (cityId) {
    where.screen = { cinema: { cityId } };
  }

  if (dateStr) {
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
    where.startTime = { gte: startOfDay, lte: endOfDay };
  } else {
    // default to shows starting from current time
    where.startTime = { gte: new Date() };
  }

  const shows = await prisma.show.findMany({
    where,
    include: {
      movie: {
        select: {
          id: true,
          title: true,
          posterUrl: true,
          durationMinutes: true,
          ageClassification: true,
          language: true,
        },
      },
      screen: {
        include: {
          cinema: {
            include: { city: true },
          },
        },
      },
      _count: {
        select: { showSeats: true },
      },
    },
    orderBy: { startTime: 'asc' },
  });

  const formatted = shows.map((s) => ({
    id: s.id,
    startTime: s.startTime,
    endTime: s.endTime,
    priceRegular: Number(s.priceRegular),
    pricePremium: Number(s.pricePremium),
    priceRecliner: Number(s.priceRecliner),
    movie: s.movie,
    screen: {
      id: s.screen.id,
      name: s.screen.name,
      soundType: s.screen.soundType,
      screenType: s.screen.screenType,
    },
    cinema: {
      id: s.screen.cinema.id,
      name: s.screen.cinema.name,
      address: s.screen.cinema.address,
      city: s.screen.cinema.city.name,
    },
  }));

  return sendSuccess(res, formatted);
});

// GET /api/v1/shows/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      movie: true,
      screen: {
        include: {
          cinema: {
            include: { city: true },
          },
        },
      },
    },
  });

  if (!show) {
    return sendError(res, 'Show not found', 404);
  }

  return sendSuccess(res, {
    ...show,
    priceRegular: Number(show.priceRegular),
    pricePremium: Number(show.pricePremium),
    priceRecliner: Number(show.priceRecliner),
  });
});

// GET /api/v1/shows/:id/seats (Real-time seat status for layout map)
router.get('/:id/seats', async (req: Request, res: Response) => {
  const { id } = req.params;

  const show = await prisma.show.findUnique({
    where: { id },
    include: {
      screen: {
        include: { cinema: true },
      },
    },
  });

  if (!show) {
    return sendError(res, 'Show not found', 404);
  }

  // Fetch all showSeats for this show
  const showSeats = await prisma.showSeat.findMany({
    where: { showId: id },
    include: {
      seat: true,
    },
    orderBy: [{ seat: { rowLabel: 'asc' } }, { seat: { seatNumber: 'asc' } }],
  });

  // Group seats by category and rows for intuitive frontend rendering
  const rowsMap: Record<string, any[]> = {};
  showSeats.forEach((ss) => {
    const row = ss.seat.rowLabel;
    if (!rowsMap[row]) {
      rowsMap[row] = [];
    }
    rowsMap[row].push({
      showSeatId: ss.id,
      seatId: ss.seatId,
      rowLabel: ss.seat.rowLabel,
      seatNumber: ss.seat.seatNumber,
      category: ss.seat.category,
      price: Number(ss.price),
      status: ss.status, // AVAILABLE, HELD, BOOKED, BLOCKED
    });
  });

  const categories = [
    { name: SeatCategory.RECLINER, price: Number(show.priceRecliner), rows: ['G'] },
    { name: SeatCategory.PREMIUM, price: Number(show.pricePremium), rows: ['D', 'E', 'F'] },
    { name: SeatCategory.REGULAR, price: Number(show.priceRegular), rows: ['A', 'B', 'C'] },
  ];

  return sendSuccess(res, {
    showId: show.id,
    screenName: show.screen.name,
    screenType: show.screen.screenType,
    soundType: show.screen.soundType,
    cinemaName: show.screen.cinema.name,
    totalSeats: showSeats.length,
    availableSeats: showSeats.filter((s) => s.status === SeatStatus.AVAILABLE).length,
    categories,
    rows: rowsMap,
  });
});

// POST /api/v1/shows (Admin Only with conflict detection)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(ShowCreateSchema),
  async (req: Request, res: Response) => {
    const data = req.body;
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);

    if (startTime >= endTime) {
      return sendError(res, 'Show start time must be before end time', 400);
    }

    // Overlap conflict detection: check if screen has any show between startTime and endTime
    const conflictingShow = await prisma.show.findFirst({
      where: {
        screenId: data.screenId,
        isActive: true,
        OR: [
          {
            startTime: { lte: startTime },
            endTime: { gte: startTime },
          },
          {
            startTime: { lte: endTime },
            endTime: { gte: endTime },
          },
          {
            startTime: { gte: startTime },
            endTime: { lte: endTime },
          },
        ],
      },
    });

    if (conflictingShow) {
      return sendError(res, 'Conflict: Screen already has a show scheduled during this time slot', 409);
    }

    // Create show and allocate ShowSeat records from the screen's seats
    const show = await prisma.$transaction(async (tx) => {
      const created = await tx.show.create({
        data: {
          movieId: data.movieId,
          screenId: data.screenId,
          startTime,
          endTime,
          priceRegular: data.priceRegular,
          pricePremium: data.pricePremium,
          priceRecliner: data.priceRecliner,
          bookingOpenTime: data.bookingOpenTime ? new Date(data.bookingOpenTime) : undefined,
          bookingCloseTime: data.bookingCloseTime ? new Date(data.bookingCloseTime) : undefined,
          isActive: true,
        },
      });

      // Fetch all seats in screen
      const seats = await tx.seat.findMany({
        where: { screenId: data.screenId, isActive: true },
      });

      const showSeatsData = seats.map((seat) => {
        let price = Number(data.priceRegular);
        if (seat.category === SeatCategory.PREMIUM) price = Number(data.pricePremium);
        if (seat.category === SeatCategory.RECLINER) price = Number(data.priceRecliner);

        return {
          showId: created.id,
          seatId: seat.id,
          status: SeatStatus.AVAILABLE,
          price,
        };
      });

      await tx.showSeat.createMany({ data: showSeatsData });

      return created;
    });

    return sendSuccess(res, show, 'Show created and seat layout initialized', 201);
  }
);

// DELETE /api/v1/shows/:id (Admin Only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if show has confirmed bookings
  const confirmedBookings = await prisma.booking.count({
    where: { showId: id, status: 'CONFIRMED' },
  });

  if (confirmedBookings > 0) {
    // Soft-cancel show
    await prisma.show.update({
      where: { id },
      data: { isActive: false },
    });
    return sendSuccess(res, null, 'Show deactivated. Note: Show contains confirmed bookings that require customer notification.');
  }

  await prisma.show.delete({ where: { id } });
  return sendSuccess(res, null, 'Show deleted successfully');
});

export default router;
