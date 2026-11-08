import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/booking.service';
import { Booking } from '../../types/booking.types';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { DirectPaymentModal } from '../../components/booking/DirectPaymentModal';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useNotification } from '../../context/NotificationContext';
import {
  Calendar,
  DollarSign,
  Car,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Search,
} from 'lucide-react';

export const OwnerBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'awaiting_payment' | 'active' | 'completed'>('all');
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await bookingService.getOwnerBookings(user.id);
      setBookings(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const handleOpenPaymentModal = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirmed = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleDetails.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'awaiting_payment') {
      return b.paymentStatus === 'NOT_PAID';
    }
    if (activeTab === 'active') {
      return ['CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus);
    }
    if (activeTab === 'completed') {
      return b.bookingStatus === 'COMPLETED';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Reservations & Direct Payment Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verify offline payments received from drivers via Cash or UPI to activate entry QR codes.
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('awaiting_payment')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'awaiting_payment'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100'
            }`}
          >
            <span>Awaiting Payment</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {bookings.filter((b) => b.paymentStatus === 'NOT_PAID').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Confirmed & Active (
            {bookings.filter((b) => ['CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'completed'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Completed ({bookings.filter((b) => b.bookingStatus === 'COMPLETED').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search booking ref, driver, plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Bookings Table / Cards */}
      {isLoading ? (
        <LoadingSkeleton count={3} className="h-28 w-full" />
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Bookings Match Filter"
          description="Try selecting a different filter or clearing search query."
        />
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <Card key={b.id} className="p-5 hoverable">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {b.bookingReference}
                    </span>
                    <BookingStatusBadge status={b.bookingStatus} />
                    <PaymentStatusBadge status={b.paymentStatus} />
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {b.parkingName}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span>
                      Driver: <strong className="text-slate-900">{b.driverName}</strong>
                    </span>
                    <span>
                      Vehicle:{' '}
                      <strong className="font-mono text-slate-900">{b.vehicleDetails.plateNumber}</strong>{' '}
                      ({b.vehicleDetails.makeModel})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                      -{' '}
                      {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end md:self-center shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Due</span>
                    <span className="text-lg font-black text-slate-900">₹{b.totalAmount}</span>
                  </div>

                  {b.paymentStatus === 'NOT_PAID' ? (
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<DollarSign className="w-4 h-4" />}
                      onClick={() => handleOpenPaymentModal(b)}
                    >
                      Confirm Direct Payment
                    </Button>
                  ) : (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Paid ({b.paymentMethod?.toUpperCase()})</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <DirectPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={selectedBookingForPayment}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
};
