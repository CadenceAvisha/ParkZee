import React from 'react';
import { BookingStatus, PaymentStatus } from '../../types/booking.types';
import { Badge } from '../common/Badge';

export const BookingStatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
  switch (status) {
    case 'RESERVED_AWAITING_OWNER_CONFIRMATION':
      return (
        <Badge variant="amber" dot>
          Awaiting Payment Confirmation
        </Badge>
      );
    case 'CONFIRMED':
      return (
        <Badge variant="emerald" dot>
          Confirmed & Active
        </Badge>
      );
    case 'CHECKED_IN':
      return (
        <Badge variant="blue" dot>
          Checked In
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge variant="slate">
          Completed
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge variant="rose">
          Cancelled
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge variant="slate">
          Expired
        </Badge>
      );
    case 'DISPUTED':
      return (
        <Badge variant="purple" dot>
          Disputed
        </Badge>
      );
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  switch (status) {
    case 'PAID_CONFIRMED_BY_OWNER':
      return (
        <Badge variant="emerald" dot>
          Paid (Owner Confirmed)
        </Badge>
      );
    case 'NOT_PAID':
      return (
        <Badge variant="amber">
          Unpaid (Direct Settlement on Arrival)
        </Badge>
      );
    case 'PAYMENT_DISPUTED':
      return (
        <Badge variant="rose" dot>
          Payment Disputed
        </Badge>
      );
    default:
      return <Badge variant="slate">{status}</Badge>;
  }
};
