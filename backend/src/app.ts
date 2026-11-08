import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/environment.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { parkingRoutes } from './modules/parking/parking.routes.js';
import { bookingRoutes } from './modules/bookings/booking.routes.js';
import { paymentRoutes } from './modules/payments/payment.routes.js';
import { qrRoutes } from './modules/qr/qr.routes.js';
import { reportRoutes } from './modules/reports/report.routes.js';
import { reviewRoutes } from './modules/reviews/review.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or Postman)
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev to avoid local dev blocking
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiting
  app.use(apiRateLimiter);

  // Health check endpoints
  const healthCheck = (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ParkZee Smart Parking Marketplace API',
      version: '1.0.0',
    });
  };

  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);

  // API Router definition
  const apiRouter = express.Router();
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', userRoutes);
  apiRouter.use('/parking', parkingRoutes);
  apiRouter.use('/bookings', bookingRoutes);
  apiRouter.use('/payments', paymentRoutes);
  apiRouter.use('/qr', qrRoutes);
  apiRouter.use('/reports', reportRoutes);
  apiRouter.use('/reviews', reviewRoutes);
  apiRouter.use('/admin', adminRoutes);

  // Mount API router under /api
  app.use('/api', apiRouter);

  // Also mount directly under root for convenient root-path access
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/parking', parkingRoutes);
  app.use('/bookings', bookingRoutes);
  app.use('/payments', paymentRoutes);
  app.use('/qr', qrRoutes);
  app.use('/reports', reportRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/admin', adminRoutes);

  // 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found.`, 404));
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

export const app = createApp();
