import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/booking.service';
import { parkingService } from '../../services/parking.service';
import { Booking } from '../../types/booking.types';
import { ParkingLocation } from '../../types/parking.types';
import { StatCard } from '../../components/dashboard/StatCard';
import { BookingStatusBadge, PaymentStatusBadge } from '../../components/booking/BookingStatusBadge';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Car,
  Compass,
  Calendar,
  Clock,
  QrCode,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const DriverDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (user) {
          const userBookings = await bookingService.getDriverBookings(user.id);
          setBookings(userBookings);
        }
        const locations = await parkingService.searchParking({});
        setNearbyLocations(locations.slice(0, 3));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const activeReservations = bookings.filter((b) =>
    ['RESERVED_AWAITING_OWNER_CONFIRMATION', 'CONFIRMED', 'CHECKED_IN'].includes(b.bookingStatus)
  );

  const completedTrips = bookings.filter((b) => b.bookingStatus === 'COMPLETED');
  const totalSpentDirect = bookings
    .filter((b) => b.paymentStatus === 'PAID_CONFIRMED_BY_OWNER')
    .reduce((sum, b) => sum + b.totalAmount, 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-navy-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-premium">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Driver Mobility Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name || 'Driver'}!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
            Find verified parking spaces near your destination, lock a slot in advance, and pay the host directly upon arrival.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Compass className="w-4 h-4" />}
              onClick={() => navigate('/search')}
            >
              Search & Book Parking
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Calendar className="w-4 h-4" />}
              onClick={() => navigate('/driver/bookings')}
            >
              View My Bookings ({bookings.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Active Reservations"
          value={activeReservations.length}
          subtitle="Currently booked or parked"
          icon={Car}
          variant="brand"
        />
        <StatCard
          title="Completed Parkings"
          value={completedTrips.length}
          subtitle="Lifetime fulfilled reservations"
          icon={ShieldCheck}
          variant="blue"
        />
        <StatCard
          title="Direct Payments Settled"
          value={`₹${totalSpentDirect}`}
          subtitle="Total owner-confirmed payments"
          icon={Clock}
          variant="emerald"
        />
      </div>

      {/* Active Upcoming Booking Spotlight (if any) */}
      {activeReservations.length > 0 && (
        <Card className="p-6 border-brand-200 bg-brand-50/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-700 bg-brand-100/70 px-2.5 py-0.5 rounded-full border border-brand-200">
                Active Upcoming Reservation
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                {activeReservations[0].parkingName}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {activeReservations[0].parkingAddress}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5">
              <BookingStatusBadge status={activeReservations[0].bookingStatus} />
              <PaymentStatusBadge status={activeReservations[0].paymentStatus} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200/80 text-xs mb-4">
            <div>
              <span className="text-slate-400 block font-medium">Booking Ref:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {activeReservations[0].bookingReference}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Vehicle:</span>
              <span className="font-semibold text-slate-800">
                {activeReservations[0].vehicleDetails.plateNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Arrival Time:</span>
              <span className="font-semibold text-slate-800">
                {new Date(activeReservations[0].startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Amount Due:</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{activeReservations[0].totalAmount}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>
                {activeReservations[0].paymentStatus === 'PAID_CONFIRMED_BY_OWNER'
                  ? 'Payment confirmed by owner. Entry QR code is active!'
                  : 'Pay owner directly upon arrival to unlock entry QR pass.'}
              </span>
            </div>

            <Link
              to={`/driver/bookings/${activeReservations[0].id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
            >
              <QrCode className="w-4 h-4" />
              <span>View Entry Pass / QR</span>
            </Link>
          </div>
        </Card>
      )}

      {/* Nearby Recommended Spots */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recommended Nearby Parking</h3>
            <p className="text-xs text-slate-500">Fastest available spaces around commercial hubs</p>
          </div>
          <Link
            to="/search"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>View Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nearbyLocations.map((loc) => (
            <Card key={loc.id} className="p-4 flex flex-col justify-between hoverable">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    {loc.parkingType}
                  </span>
                  <span className="text-xs font-bold text-slate-900">₹{loc.pricePerHour}/hr</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">{loc.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-1 mb-2">{loc.address}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-emerald-600 font-semibold">
                  {loc.availableCapacity} slots left
                </span>
                <Link
                  to={`/parking/${loc.id}`}
                  className="text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  Reserve →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
