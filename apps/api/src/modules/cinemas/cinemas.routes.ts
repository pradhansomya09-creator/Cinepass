import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { CityCreateSchema, CinemaCreateSchema, ScreenCreateSchema, UserRole } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

// GET /api/v1/cinemas/cities
router.get('/cities', async (req: Request, res: Response) => {
  const cities = await prisma.city.findMany({
    include: {
      _count: {
        select: { cinemas: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return sendSuccess(res, cities);
});

// POST /api/v1/cinemas/cities (Admin Only)
router.post('/cities', authenticate, requireRole(UserRole.ADMIN), validateBody(CityCreateSchema), async (req: Request, res: Response) => {
  const { name, state } = req.body;
  const city = await prisma.city.create({
    data: { name, state },
  });
  return sendSuccess(res, city, 'City created successfully', 201);
});

// GET /api/v1/cinemas
router.get('/', async (req: Request, res: Response) => {
  const cityId = typeof req.query.cityId === 'string' ? req.query.cityId : undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

  const where: any = {};
  if (cityId) where.cityId = cityId;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const cinemas = await prisma.cinema.findMany({
    where,
    include: {
      city: true,
      screens: {
        select: {
          id: true,
          name: true,
          soundType: true,
          screenType: true,
          _count: { select: { seats: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return sendSuccess(res, cinemas);
});

// GET /api/v1/cinemas/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const cinema = await prisma.cinema.findUnique({
    where: { id },
    include: {
      city: true,
      screens: {
        include: {
          _count: { select: { seats: true } },
          shows: {
            where: { startTime: { gte: new Date() }, isActive: true },
            include: { movie: true },
            orderBy: { startTime: 'asc' },
          },
        },
      },
    },
  });

  if (!cinema) {
    return sendError(res, 'Cinema not found', 404);
  }

  return sendSuccess(res, cinema);
});

// POST /api/v1/cinemas (Admin Only)
router.post('/', authenticate, requireRole(UserRole.ADMIN), validateBody(CinemaCreateSchema), async (req: Request, res: Response) => {
  const data = req.body;
  const cinema = await prisma.cinema.create({
    data: {
      name: data.name,
      cityId: data.cityId,
      address: data.address,
      facilities: data.facilities || [],
    },
  });
  return sendSuccess(res, cinema, 'Cinema created successfully', 201);
});

// POST /api/v1/cinemas/screens (Admin Only)
router.post('/screens', authenticate, requireRole(UserRole.ADMIN), validateBody(ScreenCreateSchema), async (req: Request, res: Response) => {
  const data = req.body;
  const screen = await prisma.screen.create({
    data: {
      name: data.name,
      cinemaId: data.cinemaId,
      soundType: data.soundType,
      screenType: data.screenType,
    },
  });
  return sendSuccess(res, screen, 'Screen created successfully', 201);
});

export default router;
