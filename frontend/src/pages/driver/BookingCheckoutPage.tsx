import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createBookingSchema, CreateBookingFormData } from '../../schemas/booking.schema';
import { parkingService } from '../../services/parking.service';
import { bookingService } from '../../services/booking.service';
import { ParkingLocation } from '../../types/parking.types';
import { Booking } from '../../types/booking.types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Car,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MapPin,
  ChevronLeft,
  Banknote,
  DollarSign,
} from 'lucide-react';

export const BookingCheckoutPage: React.FC = () => {
  const { parkingId } = useParams<{ parkingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [location, setLocation] = useState<ParkingLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const initialStart = searchParams.get('start') || '10:00';
  const initialEnd = searchParams.get('end') || '14:00';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      parkingLocationId: parkingId || '',
      vehiclePlate: 'HR26 DK 4421',
      makeModel: 'Hyundai Creta',
      vehicleType: 'car',
      bookingDate: initialDate,
      startTime: initialStart,
      endTime: initialEnd,
    },
  });

  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');
  const watchedDate = watch('bookingDate');

  useEffect(() => {
    const fetchLocation = async () => {
      if (!parkingId) return;
      setIsLoading(true);
      try {
        const data = await parkingService.getParkingById(parkingId);
        setLocation(data);
      } catch (err) {
        showToast('error', 'Error', 'Failed to load parking location details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocation();
  }, [parkingId, showToast]);

  // Compute duration & total
  const computeTotal = () => {
    if (!watchedStartTime || !watchedEndTime || !location) return 0;
    const [sH, sM] = watchedStartTime.split(':').map(Number);
    const [eH, eM] = watchedEndTime.split(':').map(Number);
    const diffHours = Math.max(1, (eH * 60 + eM - (sH * 60 + sM)) / 60);
    return Math.round(diffHours * location.pricePerHour);
  };

  const totalAmount = computeTotal();

  const onSubmit = async (data: CreateBookingFormData) => {
    if (!user) {
      showToast('error', 'Sign In Required', 'Please sign in to place your reservation.');
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Build ISO timestamps
      const startDateTime = new Date(`${data.bookingDate}T${data.startTime}:00`).toISOString();
      const endDateTime = new Date(`${data.bookingDate}T${data.endTime}:00`).toISOString();

      const booking = await bookingService.createBooking(
        user.id,
        user.name,
        user.phone || '+91 98765 43210',
        user.email,
        {
          parkingLocationId: location!.id,
          vehicleDetails: {
            plateNumber: data.vehiclePlate,
            makeModel: data.makeModel,
            vehicleType: data.vehicleType,
          },
          startTime: startDateTime,
          endTime: endDateTime,
          totalAmount,
        }
      );

      setConfirmedBooking(booking);
      showToast(
        'success',
        'Reservation Placed!',
        `Your reservation ${booking.bookingReference} has been created. Pay directly on arrival.`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Reservation failed';
      showToast('error', 'Booking Conflict', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <LoadingSkeleton count={3} className="h-44 w-full" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-lg font-bold text-slate-900 mb-2">Parking Location Not Found</h2>
        <Button variant="primary" onClick={() => navigate('/search')}>
          Back to Search
        </Button>
      </div>
    );
  }

  // Confirmation Success View
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="p-8 text-center border-emerald-200 bg-white shadow-premium">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Reservation Placed (No Payment Charged)
          </span>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3 mb-1">
            Slot Reserved Successfully!
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Reference:{' '}
            <span className="font-mono font-bold text-slate-900">
              {confirmedBooking.bookingReference}
            </span>
          </p>

          {/* Critical Direct Payment Instructions Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left text-xs text-amber-950 mb-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Banknote className="w-4 h-4 text-amber-700" />
              <span>Direct Settlement Required on Arrival</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              You have not been charged online. When you arrive at <strong>{location.name}</strong>, please pay <strong>₹{confirmedBooking.totalAmount}</strong> directly to the host via Cash or UPI.
            </p>
            <p className="text-[11px] text-amber-700 font-medium">
              * Your Entry QR Code will be unlocked automatically as soon as the parking owner confirms receipt of your payment on their device.
            </p>
          </div>

          {/* Booking Summary Box */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 text-xs grid grid-cols-2 gap-3 text-left mb-6">
            <div>
              <span className="text-slate-400 block font-medium">Parking Facility:</span>
              <span className="font-bold text-slate-800 truncate block">{location.name}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Vehicle Plate:</span>
              <span className="font-mono font-bold text-slate-900">
                {confirmedBooking.vehicleDetails.plateNumber}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Arrival Time:</span>
              <span className="font-semibold text-slate-800">
                {new Date(confirmedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Amount Due:</span>
              <span className="font-black text-slate-900 text-sm">₹{confirmedBooking.totalAmount}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={`/driver/bookings/${confirmedBooking.id}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm"
            >
              <QrCode className="w-4 h-4" /> View Booking & Entry Status
            </Link>
            <Link
              to="/driver/bookings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
            >
              My Reservations
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Parking Details
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Confirm Parking Reservation</h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter vehicle and timing details. No credit card or online payment required.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <input type="hidden" value={location.id} {...register('parkingLocationId')} />

              {/* Vehicle Selection */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Vehicle Number Plate"
                  placeholder="e.g. HR26 DK 4421"
                  error={errors.vehiclePlate?.message}
                  {...register('vehiclePlate')}
                />

                <Input
                  label="Make & Model"
                  placeholder="e.g. Honda City"
                  error={errors.makeModel?.message}
                  {...register('makeModel')}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle Category *
                </label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                  {...register('vehicleType')}
                >
                  <option value="car">Standard Sedan / Hatchback</option>
                  <option value="suv">SUV / MUV</option>
                  <option value="motorcycle">Two Wheeler / Motorcycle</option>
                  <option value="ev">Electric Vehicle (EV)</option>
                </select>
              </div>

              {/* Timing */}
              <div>
                <Input
                  label="Date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  error={errors.bookingDate?.message}
                  {...register('bookingDate')}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Arrival Time"
                  type="time"
                  error={errors.startTime?.message}
                  {...register('startTime')}
                />
                <Input
                  label="Departure Time"
                  type="time"
                  error={errors.endTime?.message}
                  {...register('endTime')}
                />
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Direct Cash/UPI Settlement on Arrival:</span>
                  <p className="text-emerald-800 mt-0.5 leading-snug">
                    You do not need to make any payment right now. When you arrive at the spot, pay ₹{totalAmount} directly to the parking owner.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                isLoading={isSubmitting}
              >
                Complete Free Reservation (₹{totalAmount} on arrival)
              </Button>
            </form>
          </Card>
        </div>

        {/* Right Summary Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Location Summary
            </h3>
            <div className="flex gap-3 mb-3">
              <img
                src={location.photos[0]}
                alt={location.name}
                className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-100"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{location.name}</h4>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{location.address}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Parking Rate:</span>
                <span className="font-semibold text-slate-900">₹{location.pricePerHour} / hour</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Available Capacity:</span>
                <span className="font-semibold text-emerald-600">
                  {location.availableCapacity} slots
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                <span>Amount Due on Arrival:</span>
                <span className="text-brand-700 font-black">₹{totalAmount}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
