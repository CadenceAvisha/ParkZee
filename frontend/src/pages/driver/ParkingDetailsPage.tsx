import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation } from '../../types/parking.types';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { reviewService, ParkingReview } from '../../services/review.service';
import {
  MapPin,
  Star,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Car,
  ChevronLeft,
  Share2,
  Heart,
  Phone,
  User,
  Zap,
  Lock,
} from 'lucide-react';

export const ParkingDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [location, setLocation] = useState<ParkingLocation | null>(null);
  const [reviews, setReviews] = useState<ParkingReview[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Booking widget form state
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');

  useEffect(() => {
    const fetchLocation = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await parkingService.getParkingById(id);
        setLocation(data);
        const reviewsData = await reviewService.getParkingReviews(id);
        setReviews(reviewsData);
      } catch (err) {
        showToast('error', 'Error', 'Failed to load parking facility details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLocation();
  }, [id, showToast]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton count={3} className="h-64 w-full" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Parking Location Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested listing may have been unlisted or does not exist.
        </p>
        <Button variant="primary" onClick={() => navigate('/search')}>
          Back to Parking Search
        </Button>
      </div>
    );
  }

  // Calculate duration and estimated total
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const diffHours = Math.max(1, (endH * 60 + endM - (startH * 60 + startM)) / 60);
  const estimatedAmount = Math.round(diffHours * location.pricePerHour);

  const handleProceedToBooking = () => {
    if (diffHours <= 0) {
      showToast('error', 'Invalid Time', 'Departure time must be after arrival time.');
      return;
    }
    const params = new URLSearchParams({
      date: bookingDate,
      start: startTime,
      end: endTime,
    });
    navigate(`/booking/${location.id}?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Back button & Title header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Search Results
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full border border-brand-200">
                {location.parkingType}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {location.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              {location.address}, {location.city} {location.postalCode ? `(${location.postalCode})` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-slate-900">₹{location.pricePerHour}</span>
                <span className="text-xs text-slate-500 font-medium">/ hour</span>
              </div>
              <p className="text-xs text-emerald-600 font-bold">
                {location.availableCapacity} / {location.totalCapacity} Slots Available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="space-y-3">
        <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-premium">
          <img
            src={
              location.photos[selectedPhotoIndex] ||
              'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80'
            }
            alt={location.name}
            className="w-full h-full object-cover"
          />
        </div>

        {location.photos.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {location.photos.map((photo, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`w-24 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhotoIndex === idx
                    ? 'border-brand-500 ring-2 ring-brand-300'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={photo} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details Left, Reservation Widget Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Description, Amenities, Specs, Owner Info */}
        <div className="lg:col-span-8 space-y-8">
          {/* Overview & Description */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">About this Parking Facility</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {location.description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Total Capacity:</span>
                <span className="font-bold text-slate-800 text-sm">{location.totalCapacity} slots</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Parking Structure:</span>
                <span className="font-bold text-slate-800 capitalize text-sm">{location.parkingType}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Operating Schedule:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {location.operatingHours.is24x7
                    ? '24 Hours / 7 Days'
                    : `${location.operatingHours.openTime} - ${location.operatingHours.closeTime}`}
                </span>
              </div>
            </div>
          </Card>

          {/* Supported Vehicles */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">Supported Vehicle Categories</h3>
            <div className="flex flex-wrap gap-2.5">
              {location.supportedVehicleTypes.map((v) => (
                <div
                  key={v}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <Car className="w-4 h-4 text-brand-600" />
                  <span className="capitalize">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Amenities & Security Facilities */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">Facility Amenities & Safety</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {location.amenities.map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-medium text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Parking Host & Contact */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">Verified Parking Host</h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{location.ownerName || 'Verified Property Host'}</h4>
                <p className="text-xs text-slate-500">Commercial Partner on ParkZee since 2026</p>
                {location.ownerPhone && (
                  <p className="text-xs text-brand-600 font-medium flex items-center gap-1 mt-1">
                    <Phone className="w-3.5 h-3.5" /> {location.ownerPhone}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Customer Reviews Section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Customer Ratings & Reviews ({reviews.length})
              </h3>
              {location.rating > 0 && (
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  ★ {location.rating.toFixed(1)} / 5.0
                </span>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No reviews yet for this parking location. Be the first to review after checkout!
              </p>
            ) : (
              <div className="space-y-3.5 divide-y divide-slate-100">
                {reviews.map((r) => (
                  <div key={r.id} className="pt-3.5 first:pt-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{r.driverName}</span>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < r.rating ? 'fill-current text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-slate-600 leading-relaxed">{r.comment}</p>}
                    <span className="text-[10px] text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Sticky Booking Widget */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <Card className="p-6 shadow-premium border-slate-200">
            <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-2xl font-black text-slate-900">₹{location.pricePerHour}</span>
                <span className="text-xs text-slate-500 font-medium"> / hr</span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{location.rating > 0 ? location.rating.toFixed(1) : 'New'}</span>
              </div>
            </div>

            {/* Direct Settlement Highlight */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 text-xs text-emerald-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Zero Online Booking Fees</p>
                <p className="text-[11px] text-emerald-800 leading-snug mt-0.5">
                  Reserve this slot for free. Pay host ₹{estimatedAmount} directly upon arrival via Cash or UPI.
                </p>
              </div>
            </div>

            {/* Booking Form Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Arrival
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Departure
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-medium text-slate-900">{diffHours.toFixed(1)} hours</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Rate:</span>
                  <span className="font-medium text-slate-900">₹{location.pricePerHour} / hour</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Amount Due on Arrival:</span>
                  <span className="text-brand-700 font-black text-base">₹{estimatedAmount}</span>
                </div>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleProceedToBooking}
                disabled={location.availableCapacity <= 0}
              >
                {location.availableCapacity > 0 ? 'Reserve Slot Now' : 'Sold Out for this Date'}
              </Button>

              <p className="text-[11px] text-slate-400 text-center">
                Free cancellation up to 30 mins before arrival.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
