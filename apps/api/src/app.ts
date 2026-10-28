import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './utils/swagger';

// Routes
import authRoutes from './modules/auth/auth.routes';
import movieRoutes from './modules/movies/movies.routes';
import cinemaRoutes from './modules/cinemas/cinemas.routes';
import showRoutes from './modules/shows/shows.routes';
import seatRoutes from './modules/seats/seats.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import paymentRoutes from './modules/payments/payments.routes';
import couponRoutes from './modules/coupons/coupons.routes';
import ticketRoutes from './modules/tickets/tickets.routes';
import userRoutes from './modules/users/users.routes';
import adminRoutes from './modules/admin/admin.routes';

export function createApp(): Express {
  const app = express();

  // 1. CORS Configuration
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-razorpay-signature'],
    })
  );

  // 2. Cookie parser & body parser
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Global rate limiting
  app.use('/api/', apiLimiter);

  // 4. Swagger documentation
  setupSwagger(app);

  // 5. Health Check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
  });

  // 6. Versioned API Routes (/api/v1)
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/movies', movieRoutes);
  apiRouter.use('/cinemas', cinemaRoutes);
  apiRouter.use('/shows', showRoutes);
  apiRouter.use('/seats', seatRoutes);
  apiRouter.use('/bookings', bookingRoutes);
  apiRouter.use('/payments', paymentRoutes);
  apiRouter.use('/coupons', couponRoutes);
  apiRouter.use('/tickets', ticketRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/admin', adminRoutes);

  app.use('/api/v1', apiRouter);

  // 7. 404 handler for unknown routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // 8. Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
