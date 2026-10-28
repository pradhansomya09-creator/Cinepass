import { Router, Response } from 'express';
import prisma from '../../config/db';
import { TicketValidateSchema, UserRole } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, requireRole, AuthenticatedRequest } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';
import { generateQrCodeDataUrl } from '../../utils/qrcode';

const router = Router();

// GET /api/v1/tickets/:id
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const isAdmin = req.user!.role === 'ADMIN';

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          seats: { include: { seat: true } },
          payment: true,
          show: {
            include: {
              movie: true,
              screen: {
                include: {
                  cinema: { include: { city: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!ticket) {
    return sendError(res, 'Ticket not found', 404);
  }

  if (ticket.booking.userId !== userId && !isAdmin) {
    return sendError(res, 'Unauthorized to view this ticket', 403);
  }

  // Generate QR code Data URL containing the secure opaque token
  const qrCodeDataUrl = await generateQrCodeDataUrl(ticket.qrToken);

  return sendSuccess(res, {
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    isRedeemed: ticket.isRedeemed,
    redeemedAt: ticket.redeemedAt,
    bookingReference: ticket.booking.bookingReference,
    bookingStatus: ticket.booking.status,
    finalAmount: Number(ticket.booking.finalAmount),
    customer: {
      name: ticket.booking.user.name,
      email: ticket.booking.user.email,
      phone: ticket.booking.user.phone,
    },
    movie: {
      id: ticket.booking.show.movie.id,
      title: ticket.booking.show.movie.title,
      posterUrl: ticket.booking.show.movie.posterUrl,
      language: ticket.booking.show.movie.language,
      ageClassification: ticket.booking.show.movie.ageClassification,
      durationMinutes: ticket.booking.show.movie.durationMinutes,
    },
    cinema: {
      name: ticket.booking.show.screen.cinema.name,
      address: ticket.booking.show.screen.cinema.address,
      city: ticket.booking.show.screen.cinema.city.name,
      screenName: ticket.booking.show.screen.name,
      soundType: ticket.booking.show.screen.soundType,
      screenType: ticket.booking.show.screen.screenType,
    },
    showTime: ticket.booking.show.startTime,
    seats: ticket.booking.seats.map((s) => ({
      label: `${s.seat.rowLabel}${s.seat.seatNumber}`,
      category: s.category,
      price: Number(s.price),
    })),
    payment: {
      status: ticket.booking.payment?.status,
      method: ticket.booking.payment?.method,
    },
    qrCodeDataUrl,
  });
});

// GET /api/v1/tickets/booking/:bookingId
router.get('/booking/:bookingId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { bookingId } = req.params;

  const ticket = await prisma.ticket.findUnique({
    where: { bookingId },
  });

  if (!ticket) {
    return sendError(res, 'No electronic ticket issued for this booking yet', 404);
  }

  // Delegate to ticket by id
  res.redirect(`/api/v1/tickets/${ticket.id}`);
});

// POST /api/v1/tickets/validate (Cinema staff/admin QR code admission validation)
router.post(
  '/validate',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(TicketValidateSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body;
    const staffName = req.user!.email;

    const ticket = await prisma.ticket.findUnique({
      where: { qrToken: token },
      include: {
        booking: {
          include: {
            user: { select: { name: true, email: true } },
            seats: { include: { seat: true } },
            show: {
              include: {
                movie: true,
                screen: { include: { cinema: true } },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return sendError(res, 'Invalid ticket: Token not recognized', 404);
    }

    if (ticket.isRedeemed) {
      return sendError(
        res,
        `TICKET ALREADY REDEEMED! Scanned on ${new Date(ticket.redeemedAt!).toLocaleString('en-IN')}`,
        400,
        {
          redeemedAt: ticket.redeemedAt,
          redeemedBy: ticket.redeemedBy,
        }
      );
    }

    // Atomically redeem ticket
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        isRedeemed: true,
        redeemedAt: new Date(),
        redeemedBy: staffName,
      },
    });

    const seatLabels = ticket.booking.seats.map((s) => `${s.seat.rowLabel}${s.seat.seatNumber}`).join(', ');

    return sendSuccess(
      res,
      {
        ticketNumber: ticket.ticketNumber,
        bookingRef: ticket.booking.bookingReference,
        movieTitle: ticket.booking.show.movie.title,
        screenName: ticket.booking.show.screen.name,
        cinemaName: ticket.booking.show.screen.cinema.name,
        seats: seatLabels,
        customerName: ticket.booking.user.name,
        redeemedAt: updated.redeemedAt,
      },
      'Ticket verified successfully! Customer admitted.'
    );
  }
);

export default router;
