import http from 'http';
import { app } from './app.js';
import { env } from './config/environment.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { initSocketServer } from './realtime/socket.js';
import { startReservationExpiryWorker } from './workers/expiryWorker.js';
import { seedDatabase } from './config/seed.js';

const startServer = async (): Promise<void> => {
  try {
    console.log('[ParkZee] Initializing database connection...');
    await connectDatabase();

    // Provision only the trusted administrator configured in the server environment.
    if (process.env.NODE_ENV !== 'test') {
      await seedDatabase();
    }

    const httpServer = http.createServer(app);

    // Attach Socket.IO
    initSocketServer(httpServer);
    console.log('[ParkZee] Real-time Socket.IO server initialized.');

    // Start background reservation expiry cron
    startReservationExpiryWorker();
    console.log('[ParkZee] Reservation expiry worker scheduled.');

    httpServer.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` ParkZee Smart Parking Backend API is RUNNING!        `);
      console.log(` Environment : ${env.NODE_ENV}                       `);
      console.log(` Port        : ${env.PORT}                           `);
      console.log(` API Base    : http://localhost:${env.PORT}/api      `);
      console.log(` HealthCheck : http://localhost:${env.PORT}/health   `);
      console.log(`=======================================================`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n[ParkZee] Received ${signal}. Gracefully shutting down...`);
      httpServer.close(async () => {
        await disconnectDatabase();
        console.log('[ParkZee] Server terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[ParkZee] Fatal error starting server:', error);
    process.exit(1);
  }
};

// Catch unhandled errors
process.on('unhandledRejection', (reason) => {
  console.error('[ParkZee] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[ParkZee] Uncaught Exception:', err);
  process.exit(1);
});

startServer();
