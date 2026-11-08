import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookingService } from '../../services/booking.service';
import { Booking } from '../../types/booking.types';
import { QRCodeDisplay } from '../../components/qr/QRCodeDisplay';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Car,
  MapPin,
  ShieldCheck,
  Ban,
  Receipt,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const DriverBookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await bookingService.getBookingById(id);
        setBooking(data);
      } catch (err) {
        showToast('error', 'Error', 'Failed to retrieve booking details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id, showToast]);

  const handleCancelBooking = async () => {
    if (!booking) return;
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;

    setIsCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id, 'Cancelled by driver');
      setBooking(updated);
      showToast('info', 'Booking Cancelled', 'Your reservation was cancelled successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      showToast('error', 'Error', msg);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingSkeleton count={3} className="h-44 w-full" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Booking Record Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/driver/bookings')}>
          Back to My Bookings
        </Button>
      </div>
    );
  }

  const canCancel = ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED'].includes(
    booking.bookingStatus
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div>
        <button
          onClick={() => navigate('/driver/bookings')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to My Bookings
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {booking.bookingReference}
              </span>
              <BookingStatusBadge status={booking.bookingStatus} />
              <PaymentStatusBadge status={booking.paymentStatus} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {booking.parkingName}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {booking.parkingAddress}
            </p>
          </div>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isCancelling}
              leftIcon={<Ban className="w-3.5 h-3.5 text-rose-500" />}
              onClick={handleCancelBooking}
              className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
            >
              Cancel Reservation
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid: Left QR Display (5 cols), Right Lifecycle & Summary (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* QR Section */}
        <div className="lg:col-span-5">
          <QRCodeDisplay booking={booking} />
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-7 space-y-5">
          {/* Timeline & Schedule */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" /> Reservation Schedule
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Arrival Time:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(booking.startTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Departure Time:</span>
                <span className="font-semibold text-slate-800 text-sm">
                  {new Date(booking.endTime).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Total Duration:</span>
                <span className="font-bold text-slate-900">{booking.durationHours} Hours</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Entry Status:</span>
                <span className="font-bold text-slate-900">
                  {booking.checkInTime ? (
                    <span className="text-blue-600">
                      Checked In at {new Date(booking.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  ) : (
                    'Not Checked In Yet'
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Vehicle Information */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-brand-600" /> Registered Vehicle
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Number Plate:</span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block text-sm">
                  {booking.vehicleDetails.plateNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Make & Model:</span>
                <span className="font-semibold text-slate-800">
                  {booking.vehicleDetails.makeModel}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category:</span>
                <span className="font-semibold text-slate-800 capitalize">
                  {booking.vehicleDetails.vehicleType}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment & Audit Breakdown */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-brand-600" /> Settlement & Direct Payment Details
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Parking Base Rate:</span>
                <span className="font-semibold text-slate-900">₹{booking.pricePerHour} / hour</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Convenience Fee:</span>
                <span className="font-semibold text-emerald-600">₹0 (Free Marketplace)</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-brand-700">₹{booking.totalAmount}</span>
              </div>
            </div>

            {booking.paymentStatus === 'PAID_CONFIRMED_BY_OWNER' ? (
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Direct Payment Confirmed by Parking Host</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Method: <strong className="uppercase">{booking.paymentMethod}</strong> | Confirmed by: {booking.paymentConfirmedBy}
                </p>
                {booking.paymentNotes && (
                  <p className="text-[11px] text-emerald-800 italic">
                    Note: "{booking.paymentNotes}"
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Offline Settlement on Arrival</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Pay ₹{booking.totalAmount} directly to the parking owner at the location via Cash or UPI. The host will record the receipt to unlock your gate QR pass.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
