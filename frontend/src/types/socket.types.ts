export interface ServerToClientEvents {
  'parking:availability_updated': (data: { parkingId: string; availableCapacity: number; timestamp: string }) => void;
  'booking:created': (data: { bookingId: string; bookingReference: string; parkingId: string }) => void;
  'booking:confirmed': (data: { bookingId: string; bookingReference: string; confirmedAt: string }) => void;
  'booking:cancelled': (data: { bookingId: string; bookingReference: string; reason?: string }) => void;
  'booking:checked_in': (data: { bookingId: string; checkInTime: string }) => void;
  'booking:completed': (data: { bookingId: string; checkOutTime: string }) => void;
  'reservation:expired': (data: { bookingId: string; bookingReference: string }) => void;
}

export interface ClientToServerEvents {
  'parking:join': (parkingId: string) => void;
  'parking:leave': (parkingId: string) => void;
  'user:authenticate': (token: string) => void;
}
