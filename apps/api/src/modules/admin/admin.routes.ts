import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { UserRole, BookingStatus, PaymentStatus } from '@movie-booking/shared';
import { authenticate, requireRole } from '../../middleware/auth';
import { sendSuccess, sendPaginated } from '../../utils/response';

const router = Router();

// Protect all admin routes with authentication and ADMIN role check
router.use(authenticate, requireRole(UserRole.ADMIN));

// GET /api/v1/admin/dashboard (Comprehensive analytics & financial KPIs)
router.get('/dashboard', async (req: Request, res: Response) => {
  const [
    totalUsers,
    totalMovies,
    totalCinemas,
    upcomingShows,
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    payments,
    refunds,
    totalShowSeats,
    bookedShowSeats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.movie.count(),
    prisma.cinema.count(),
    prisma.show.count({ where: { startTime: { gte: new Date() }, isActive: true } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
    prisma.booking.count({ where: { status: BookingStatus.CANCELLED } }),
    prisma.payment.findMany({ where: { status: PaymentStatus.SUCCESS } }),
    prisma.refund.findMany(),
    prisma.showSeat.count(),
    prisma.showSeat.count({ where: { status: 'BOOKED' } }),
  ]);

  const grossBookingValue = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const totalRefunds = refunds.reduce((acc, r) => acc + Number(r.amount), 0);
  const netRevenue = Math.max(0, grossBookingValue - totalRefunds);
  const occupancyRate = totalShowSeats > 0 ? Math.round((bookedShowSeats / totalShowSeats) * 100) : 0;

  // Chart 1: Most popular movies by bookings
  const topMoviesRaw = await prisma.movie.findMany({
    take: 5,
    include: {
      shows: {
        include: {
          _count: { select: { bookings: true } },
        },
      },
    },
  });

  const popularMovies = topMoviesRaw.map((m) => {
    const bookingCount = m.shows.reduce((acc, s) => acc + s._count.bookings, 0);
    return {
      id: m.id,
      title: m.title,
      posterUrl: m.posterUrl,
      bookingsCount: bookingCount,
      rating: Number(m.rating),
    };
  }).sort((a, b) => b.bookingsCount - a.bookingsCount);

  // Chart 2: Daily bookings (last 7 days)
  const now = new Date();
  const dailyBookings: { date: string; bookings: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const start = new Date(`${dateStr}T00:00:00.000Z`);
    const end = new Date(`${dateStr}T23:59:59.999Z`);

    const dayBookings = await prisma.booking.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: BookingStatus.CONFIRMED,
      },
    });

    const dayRev = dayBookings.reduce((acc, b) => acc + Number(b.finalAmount), 0);
    dailyBookings.push({
      date: dateStr,
      bookings: dayBookings.length,
      revenue: dayRev,
    });
  }

  // Recent 10 bookings
  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      show: { include: { movie: true, screen: { include: { cinema: true } } } },
      payment: true,
    },
  });

  return sendSuccess(res, {
    metrics: {
      totalUsers,
      totalMovies,
      totalCinemas,
      upcomingShows,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      grossBookingValue,
      totalRefunds,
      netRevenue,
      occupancyRate,
    },
    popularMovies,
    dailyBookings,
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      bookingReference: b.bookingReference,
      customer: b.user.name,
      movie: b.show.movie.title,
      cinema: b.show.screen.cinema.name,
      finalAmount: Number(b.finalAmount),
      status: b.status,
      paymentStatus: b.payment?.status || 'N/A',
      createdAt: b.createdAt,
    })),
  });
});

// GET /api/v1/admin/bookings (List and filter all bookings)
router.get('/bookings', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) where.status = status;
  if (search) {
    where.OR = [
      { bookingReference: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        show: { include: { movie: true, screen: { include: { cinema: true } } } },
        seats: { include: { seat: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const formatted = bookings.map((b) => ({
    id: b.id,
    bookingReference: b.bookingReference,
    customer: b.user,
    movieTitle: b.show.movie.title,
    cinemaName: b.show.screen.cinema.name,
    screenName: b.show.screen.name,
    showTime: b.show.startTime,
    totalAmount: Number(b.totalAmount),
    discountAmount: Number(b.discountAmount),
    finalAmount: Number(b.finalAmount),
    status: b.status,
    seatsCount: b.seats.length,
    seats: b.seats.map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', '),
    paymentStatus: b.payment?.status,
    createdAt: b.createdAt,
  }));

  return sendPaginated(res, formatted, { page, limit, total });
});

// GET /api/v1/admin/users (List all users)
router.get('/users', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return sendPaginated(res, users, { page, limit, total });
});

// PATCH /api/v1/admin/users/:id/role (Promote/demote user role)
router.patch('/users/:id/role', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return sendSuccess(res, updated, 'User role updated successfully');
});

// GET /api/v1/admin/payments (Financial audit log)
router.get('/payments', async (req: Request, res: Response) => {
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          user: { select: { name: true, email: true } },
          show: { include: { movie: true } },
        },
      },
      refunds: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return sendSuccess(res, payments);
});

export default router;
