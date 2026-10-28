import { Router, Request, Response } from 'express';
import prisma from '../../config/db';
import { MovieCreateSchema, UserRole } from '@movie-booking/shared';
import { validateBody } from '../../middleware/validate';
import { authenticate, requireRole } from '../../middleware/auth';
import { sendSuccess, sendPaginated, sendError } from '../../utils/response';

const router = Router();

// GET /api/v1/movies
router.get('/', async (req: Request, res: Response) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
  const genre = typeof req.query.genre === 'string' ? req.query.genre.trim() : undefined;
  const language = typeof req.query.language === 'string' ? req.query.language.trim() : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : undefined; // 'now_showing' | 'coming_soon' | 'featured'
  const cityId = typeof req.query.cityId === 'string' ? req.query.cityId.trim() : undefined;
  const sortBy = typeof req.query.sortBy === 'string' ? req.query.sortBy : 'popularity'; // 'popularity' | 'rating' | 'releaseDate'

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { director: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (genre) {
    where.genres = {
      some: {
        genre: { name: { equals: genre, mode: 'insensitive' } },
      },
    };
  }

  if (language) {
    where.language = { equals: language, mode: 'insensitive' };
  }

  if (status === 'coming_soon') {
    where.isComingSoon = true;
  } else if (status === 'now_showing') {
    where.isComingSoon = false;
  } else if (status === 'featured') {
    where.isFeatured = true;
  }

  // Filter movies that have shows in the selected city
  if (cityId) {
    where.shows = {
      some: {
        screen: {
          cinema: {
            cityId: cityId,
          },
        },
        startTime: { gte: new Date() },
      },
    };
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'rating') {
    orderBy = { rating: 'desc' };
  } else if (sortBy === 'releaseDate') {
    orderBy = { releaseDate: 'desc' };
  } else if (sortBy === 'popularity') {
    orderBy = [{ isFeatured: 'desc' }, { rating: 'desc' }];
  }

  const [total, movies] = await Promise.all([
    prisma.movie.count({ where }),
    prisma.movie.findMany({
      where,
      include: {
        genres: {
          include: { genre: true },
        },
        _count: {
          select: { shows: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
  ]);

  const formatted = movies.map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    durationMinutes: m.durationMinutes,
    releaseDate: m.releaseDate,
    language: m.language,
    rating: Number(m.rating),
    ageClassification: m.ageClassification,
    director: m.director,
    cast: m.cast,
    posterUrl: m.posterUrl,
    bannerUrl: m.bannerUrl,
    trailerUrl: m.trailerUrl,
    isFeatured: m.isFeatured,
    isComingSoon: m.isComingSoon,
    genres: m.genres.map((g) => g.genre.name),
    hasShows: m._count.shows > 0,
  }));

  return sendPaginated(res, formatted, { page, limit, total });
});

// GET /api/v1/movies/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const movie = await prisma.movie.findUnique({
    where: { id },
    include: {
      genres: { include: { genre: true } },
      reviews: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!movie) {
    return sendError(res, 'Movie not found', 404);
  }

  // Fetch upcoming show dates and cinemas
  const upcomingShows = await prisma.show.findMany({
    where: {
      movieId: id,
      startTime: { gte: new Date() },
      isActive: true,
    },
    include: {
      screen: {
        include: {
          cinema: {
            include: { city: true },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 50,
  });

  return sendSuccess(res, {
    ...movie,
    rating: Number(movie.rating),
    genres: movie.genres.map((g) => g.genre.name),
    upcomingShowsCount: upcomingShows.length,
    shows: upcomingShows.map((s) => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      screenName: s.screen.name,
      screenType: s.screen.screenType,
      soundType: s.screen.soundType,
      cinema: {
        id: s.screen.cinema.id,
        name: s.screen.cinema.name,
        address: s.screen.cinema.address,
        city: s.screen.cinema.city.name,
        cityId: s.screen.cinema.cityId,
      },
      pricing: {
        regular: Number(s.priceRegular),
        premium: Number(s.pricePremium),
        recliner: Number(s.priceRecliner),
      },
    })),
  });
});

// POST /api/v1/movies (Admin Only)
router.post(
  '/',
  authenticate,
  requireRole(UserRole.ADMIN),
  validateBody(MovieCreateSchema),
  async (req: Request, res: Response) => {
    const data = req.body;

    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        description: data.description,
        durationMinutes: data.durationMinutes,
        releaseDate: new Date(data.releaseDate),
        language: data.language,
        rating: data.rating || 0.0,
        ageClassification: data.ageClassification || 'UA',
        director: data.director,
        cast: data.cast || [],
        posterUrl: data.posterUrl,
        bannerUrl: data.bannerUrl,
        trailerUrl: data.trailerUrl,
        isFeatured: data.isFeatured ?? false,
        isComingSoon: data.isComingSoon ?? false,
      },
    });

    // Link or create genres
    for (const gName of data.genres) {
      const genre = await prisma.genre.upsert({
        where: { name: gName },
        update: {},
        create: { name: gName },
      });

      await prisma.movieGenre.create({
        data: { movieId: movie.id, genreId: genre.id },
      });
    }

    return sendSuccess(res, movie, 'Movie created successfully', 201);
  }
);

// PATCH /api/v1/movies/:id (Admin Only)
router.patch('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const updatePayload: any = { ...data };
  delete updatePayload.genres;
  if (data.releaseDate) updatePayload.releaseDate = new Date(data.releaseDate);

  const movie = await prisma.movie.update({
    where: { id },
    data: updatePayload,
  });

  return sendSuccess(res, movie, 'Movie updated successfully');
});

// DELETE /api/v1/movies/:id (Admin Only)
router.delete('/:id', authenticate, requireRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.movie.delete({ where: { id } });
  return sendSuccess(res, null, 'Movie deleted successfully');
});

export default router;
