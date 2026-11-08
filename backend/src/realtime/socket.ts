import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken, JwtPayload } from '../utils/token.js';
import { env } from '../config/environment.js';

let io: Server | null = null;

export const initSocketServer = (httpServer: HttpServer): Server => {
  const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Allow unauthenticated connection for public parking availability updates
        return next();
      }

      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch (err) {
      // Allow unauthenticated connection gracefully without crashing
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    const user: JwtPayload | undefined = socket.data.user;

    if (user) {
      // Join authenticated user's private room
      socket.join(`user:${user.userId}`);

      if (user.role.toUpperCase() === 'OWNER') {
        socket.join(`owner:${user.userId}`);
      }

      if (user.role.toUpperCase() === 'ADMIN') {
        socket.join('admin:room');
      }
    }

    // Join / leave specific parking facility rooms for live availability updates
    socket.on('parking:join', (parkingId: string) => {
      if (parkingId) {
        socket.join(`parking:${parkingId}`);
      }
    });

    socket.on('parking:leave', (parkingId: string) => {
      if (parkingId) {
        socket.leave(`parking:${parkingId}`);
      }
    });

    socket.on('disconnect', () => {
      // Cleanup happens automatically in Socket.IO
    });
  });

  return io;
};

export const getIO = (): Server | null => io;

export const emitToUser = (userId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

export const emitToOwner = (ownerId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`owner:${ownerId}`).emit(event, payload);
  }
};

export const emitToParking = (parkingId: string, event: string, payload: any): void => {
  if (io) {
    io.to(`parking:${parkingId}`).emit(event, payload);
  }
};

export const emitToAdmin = (event: string, payload: any): void => {
  if (io) {
    io.to('admin:room').emit(event, payload);
  }
};

export const broadcastLiveEvent = (event: string, payload: any): void => {
  if (io) {
    io.emit(event, payload);
  }
};
