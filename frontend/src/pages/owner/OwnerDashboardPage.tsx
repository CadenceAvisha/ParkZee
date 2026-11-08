import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { parkingService } from '../../services/parking.service';
import { bookingService } from '../../services/booking.service';
import { paymentService } from '../../services/payment.service';
import { ParkingLocation } from '../../types/parking.types';
import { Booking } from '../../types/booking.types';
import { StatCard } from '../../components/dashboard/StatCard';
import { RevenueChart } from '../../components/dashboard/RevenueChart';
import { DirectPaymentModal } from '../../components/booking/DirectPaymentModal';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Building,
  MapPin,
  Calendar,
  DollarSign,
  QrCode,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const OwnerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOwnerData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const ownerLocs = await parkingService.getOwnerListings(user.id);
        setLocations(ownerLocs);
        const ownerBookings = await bookingService.getOwnerBookings(user.id);
        setBookings(ownerBookings);
      } finally {
        setIsLoading(false);
      }
    };
    loadOwnerData();
  }, [user]);

  // Direct Revenue confirmed
  const directRevenue = bookings
    .filter((b) => b.paymentStatus === 'PAID_CONFIRMED_BY_OWNER')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const pendingConfirmationBookings = bookings.filter(
    (b) => b.bookingStatus === 'RESERVED_AWAITING_OWNER_CONFIRMATION'
  );

  const activeBookings = bookings.filter((b) =>
    ['CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus)
  );

  const totalCapacity = locations.reduce((sum, l) => sum + l.totalCapacity, 0);
  const availableCapacity = locations.reduce((sum, l) => sum + l.availableCapacity, 0);
  const occupancyPercentage =
    totalCapacity > 0 ? Math.round(((totalCapacity - availableCapacity) / totalCapacity) * 100) : 0;

  const handleOpenPaymentModal = (booking: Booking) => {
    setSelectedBookingForPayment(booking);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirmed = (updatedBooking: Booking) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === updatedBooking.id ? updatedBooking : b))
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-premium">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-800">
            Property Host Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            Owner Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300">
            Track parking reservations, confirm direct offline cash/UPI payments, and scan gate QR codes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/owner/listings/new')}
          >
            Add New Parking
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<QrCode className="w-4 h-4" />}
            onClick={() => navigate('/owner/scanner')}
          >
            Open QR Scanner
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Direct Revenue Confirmed"
          value={`₹${directRevenue}`}
          subtitle="100% retained by you"
          icon={DollarSign}
          variant="brand"
        />
        <StatCard
          title="Active Listings"
          value={locations.filter((l) => l.verificationStatus === 'approved').length}
          subtitle={`${locations.length} total facilities`}
          icon={Building}
          variant="blue"
        />
        <StatCard
          title="Pending Payments"
          value={pendingConfirmationBookings.length}
          subtitle="Drivers waiting at location"
          icon={AlertCircle}
          variant="amber"
        />
        <StatCard
          title="Current Occupancy"
          value={`${occupancyPercentage}%`}
          subtitle={`${totalCapacity - availableCapacity} / ${totalCapacity} slots in use`}
          icon={TrendingUp}
          variant="emerald"
        />
      </div>

      {/* Pending Direct Payment Confirmations Alert Banner (Critical workflow!) */}
      {pendingConfirmationBookings.length > 0 && (
        <Card className="p-6 border-amber-300 bg-amber-50/50">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">
                Action Required: {pendingConfirmationBookings.length} Direct Payments Awaiting Your Confirmation
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-semibold">
              Drivers cannot enter without owner confirmation
            </span>
          </div>

          <div className="space-y-3">
            {pendingConfirmationBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {b.bookingReference}
                    </span>
                    <span className="font-bold text-slate-900">{b.parkingName}</span>
                  </div>
                  <p className="text-slate-600">
                    Driver: <strong>{b.driverName}</strong> | Vehicle: <strong>{b.vehicleDetails.plateNumber}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">Amount Due</span>
                    <span className="font-black text-slate-900 text-sm">₹{b.totalAmount}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    onClick={() => handleOpenPaymentModal(b)}
                  >
                    Confirm Direct Payment
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts and Revenue Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Direct Settlement Architecture</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              ParkZee does not process online payments. Drivers settle directly with you via Cash or UPI. 
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero gateway processing commissions.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Immediate cash liquidity in your hand or UPI account.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Immutable audit trail with driver timestamp.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Reservations Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Customer Reservations</h3>
            <p className="text-xs text-slate-500">Live booking activity across your parking spaces</p>
          </div>
          <Link
            to="/owner/bookings"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View All Reservations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Bookings Yet"
            description="Reservations made by drivers will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Driver & Vehicle</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Timing</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Booking Status</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.slice(0, 5).map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {booking.bookingReference}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{booking.driverName}</p>
                      <p className="text-[11px] text-slate-500">{booking.vehicleDetails.plateNumber}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                      {booking.parkingName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{booking.totalAmount}</td>
                    <td className="py-3 px-4">
                      <BookingStatusBadge status={booking.bookingStatus} />
                    </td>
                    <td className="py-3 px-4">
                      <PaymentStatusBadge status={booking.paymentStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {booking.paymentStatus === 'NOT_PAID' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenPaymentModal(booking)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          Confirm Receipt
                        </Button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold">Confirmed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Direct Payment Confirmation Modal */}
      <DirectPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        booking={selectedBookingForPayment}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
};
