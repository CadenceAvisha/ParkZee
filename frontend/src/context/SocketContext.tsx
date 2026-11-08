import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface SocketContextType {
  socket: Socket | null;
  joinParkingRoom: (parkingId: string) => void;
  leaveParkingRoom: (parkingId: string) => void;
  emitCustomEvent: (eventName: string, payload: unknown) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const { showToast } = useNotification();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only attempt connection if token is present
    if (!token) return;

    try {
      const socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 3,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Real-time Socket.IO connected:', socket.id);
      });

      socket.on('connect_error', (err) => {
        // Suppress noisy logs when backend is offline
        console.debug('Socket server offline or unreachable (operating in offline sync mode):', err.message);
      });

      // Standard Real-time Event Listeners
      socket.on('booking:confirmed', (data: { bookingReference: string }) => {
        showToast(
          'success',
          'Payment Confirmed!',
          `Direct payment for booking ${data.bookingReference} has been confirmed. Entry QR is now active.`
        );
      });

      socket.on('booking:created', (data: { bookingReference: string }) => {
        showToast(
          'info',
          'New Reservation Received',
          `Reservation ${data.bookingReference} has been placed awaiting direct payment.`
        );
      });

      socket.on('booking:checked_in', (data: { bookingReference: string }) => {
        showToast('info', 'Vehicle Checked-In', `Booking ${data.bookingReference} entry recorded via QR.`);
      });

      socket.on('booking:completed', (data: { bookingReference: string }) => {
        showToast('success', 'Session Completed', `Booking ${data.bookingReference} checkout finalized.`);
      });

      socket.on('parking:availability_updated', (data: { parkingId: string; availableCapacity: number }) => {
        console.log('Real-time capacity updated:', data);
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket initialization skipped', e);
    }
  }, [token, showToast]);

  const joinParkingRoom = (parkingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('parking:join', parkingId);
    }
  };

  const leaveParkingRoom = (parkingId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('parking:leave', parkingId);
    }
  };

  const emitCustomEvent = (eventName: string, payload: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(eventName, payload);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        joinParkingRoom,
        leaveParkingRoom,
        emitCustomEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
