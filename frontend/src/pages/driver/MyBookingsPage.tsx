import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/booking.service';
import { Booking } from '../../types/booking.types';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Calendar,
  Car,
  Clock,
  MapPin,
  QrCode,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const data = await bookingService.getDriverBookings(user.id);
        setBookings(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadBookings();
  }, [user]);

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'upcoming') {
      return ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus);
    }
    if (activeTab === 'completed') {
      return b.bookingStatus === 'COMPLETED';
    }
    if (activeTab === 'cancelled') {
      return ['CANCELLED', 'EXPIRED'].includes(b.bookingStatus);
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Reservations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track your parking passes, direct payment confirmation, and gate QR entry.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Car className="w-4 h-4" />}
          onClick={() => navigate('/search')}
        >
          Find New Parking
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'upcoming'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Active & Upcoming (
          {
            bookings.filter((b) =>
              ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus)
            ).length
          }
          )
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Completed ({bookings.filter((b) => b.bookingStatus === 'COMPLETED').length})
        </button>
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition-all ${
            activeTab === 'cancelled'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Cancelled ({bookings.filter((b) => ['CANCELLED', 'EXPIRED'].includes(b.bookingStatus)).length})
        </button>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSkeleton count={3} className="h-32 w-full" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Reservations Found"
          description="You do not have any bookings in this section."
          actionText="Search Available Parking"
          onAction={() => navigate('/search')}
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="p-5 sm:p-6 hoverable">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {booking.bookingReference}
                    </span>
                    <BookingStatusBadge status={booking.bookingStatus} />
                    <PaymentStatusBadge status={booking.paymentStatus} />
                  </div>

                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {booking.parkingName}
                  </h3>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {booking.parkingAddress}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 shrink-0">
                  <span className="text-lg font-black text-slate-900">₹{booking.totalAmount}</span>
                  <span className="text-[11px] text-slate-500">
                    {booking.durationHours} hrs duration
                  </span>
                </div>
              </div>

              {/* Timing & Vehicle Details Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(booking.startTime).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                    -{' '}
                    {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    {booking.vehicleDetails.plateNumber}
                  </span>
                </div>

                <Link
                  to={`/driver/bookings/${booking.id}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  {booking.paymentStatus === 'PAID_CONFIRMED_BY_OWNER' ? (
                    <>
                      <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                      <span>View Entry QR Pass</span>
                    </>
                  ) : (
                    <span>View Booking Details →</span>
                  )}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
