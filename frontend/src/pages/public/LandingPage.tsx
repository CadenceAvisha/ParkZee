import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Car,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  QrCode,
  ArrowRight,
  Sparkles,
  Zap,
  Building,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ParkingCard } from '../../components/parking/ParkingCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation } from '../../types/parking.types';
import { VehicleType } from '../../types/user.types';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [featuredLocations, setFeaturedLocations] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationQuery, setLocationQuery] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('car');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('14:00');

  useEffect(() => {
    setIsLoading(true);
    parkingService
      .searchParking({ sortBy: 'rating' })
      .then((results) => {
        if (results && results.length > 0) {
          setFeaturedLocations(results.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      q: locationQuery,
      vehicle: vehicleType,
      date,
      start: startTime,
      end: endTime,
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 lg:pt-20 pb-16 bg-gradient-to-b from-brand-50/60 via-slate-50 to-white overflow-hidden border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/70 border border-brand-200 text-brand-800 text-xs font-semibold uppercase tracking-wider mb-5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Next-Gen Smart Mobility & Parking Marketplace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-none">
              Park without the hassle.{' '}
              <span className="text-brand-600">Reserve spot, pay directly.</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed">
              Find and lock your parking space in advance with zero online booking fees. Settle directly with the property owner upon arrival via Cash or UPI.
            </p>
          </div>

          {/* Main Search Interface Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-premium border border-slate-200/80 p-4 sm:p-6">
            <form onSubmit={handleHeroSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-600" /> Destination / Area
                  </label>
                  <input
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder="Enter city, metro station, or landmark..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" /> Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 bg-white"
                  />
                </div>

                {/* Vehicle Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-brand-600" /> Vehicle
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 bg-white"
                  >
                    <option value="car">Car (Sedan/Hatch)</option>
                    <option value="suv">SUV / MUV</option>
                    <option value="motorcycle">Two Wheeler / Bike</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                  </select>
                </div>
              </div>

              {/* Time Interval & Submit */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Arrival:</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-slate-300">to</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-medium">Departure:</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto px-8"
                  leftIcon={<Search className="w-4 h-4" />}
                >
                  Find Available Spaces
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Direct Smart Parking Works
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            A frictionless, transparent 4-step workflow engineered for trust and speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle relative">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-sm mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Search & Compare</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore real-time verified parking facilities, prices, amenities, and walking distance to your destination.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle relative">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-sm mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Reserve Slot Free</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lock your time interval instantly. No payment card or gateway fees needed at the time of reservation.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle relative">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-sm mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Pay Directly on Arrival</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Arrive at the location and pay the parking owner directly via UPI or Cash. The owner confirms receipt in their app.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle relative">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center font-bold text-sm mb-4">
              4
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Instant QR Entry</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your official entry QR code activates immediately upon owner confirmation. Attendant scans code for secure check-in.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Parking Locations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Verified Parking Spaces
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Top-rated commercial and private lots ready for reservation
            </p>
          </div>
          <Link
            to="/search"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-1.5"
          >
            <span>View All Nearby Locations</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <LoadingSkeleton count={3} className="h-64 w-full" />
        ) : featuredLocations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredLocations.map((location) => (
              <ParkingCard key={location.id} location={location} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-2xl">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Verified Parking Facilities</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Use our interactive search to discover nearby available parking spaces, or register as a host to list your property.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => navigate('/search')}>
                Explore Map
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/register')}>
                Host Parking
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Dual Value Propositions: Drivers vs Owners */}
      <section className="bg-slate-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* For Drivers */}
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-400 bg-brand-950/60 px-3 py-1 rounded-full border border-brand-800">
                <Car className="w-3.5 h-3.5" /> For Commuters & Drivers
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                Never circle the block looking for parking again
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Zero upfront payment:</strong> Reserve without entering bank cards or paying commission surcharges.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Guaranteed availability:</strong> Our double-booking prevention engine ensures your spot is reserved.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span><strong>Secure QR authorization:</strong> Encrypted QR code ensures seamless check-in at the gate.</span>
                </li>
              </ul>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Find Parking Now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* For Owners */}
            <div className="bg-slate-800/80 p-8 rounded-3xl border border-slate-700 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 px-3 py-1 rounded-full border border-teal-800">
                <Building className="w-3.5 h-3.5" /> For Property Owners
              </div>
              <h3 className="text-2xl font-bold tracking-tight">
                Monetize your empty driveway, basement, or parking lot
              </h3>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>100% Direct revenue retention:</strong> Keep all earnings directly from drivers via cash or UPI.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Complete schedule control:</strong> Define operating hours, vehicle types, and block unrentable days anytime.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span><strong>Built-in QR scanner:</strong> Use our attendant scanner to verify booking tickets in under 2 seconds.</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                List Your Parking Space <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Safety Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-subtle">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Safety, Verification & Transparency
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Every feature is built with robust operational standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Admin Vetted Listings</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every parking space undergoes administrative review before becoming bookable to ensure real physical presence.
              </p>
            </div>

            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-200">
                <QrCode className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Cryptographic QR Tokens</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tokens are activated exclusively following verified owner payment confirmation and prevent duplicate entry scans.
              </p>
            </div>

            <div className="p-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3 border border-brand-200">
                <DollarSign className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">Direct Settlement Audit</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Full immutable audit logs timestamping the exact amount, payment method, and owner attestation for every booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-brand-700 to-teal-700 rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <h2 className="text-3xl font-extrabold tracking-tight mb-3">
            Ready to park smarter or earn from your empty space?
          </h2>
          <p className="text-sm text-brand-100 max-w-xl mx-auto mb-8">
            Join thousands of daily drivers and verified parking providers across major metropolitan hubs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/search"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-brand-800 font-bold text-xs shadow-md hover:bg-slate-50 transition-colors"
            >
              Explore Parking Nearby
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-900/60 hover:bg-brand-900/80 border border-brand-400 text-white font-semibold text-xs transition-colors"
            >
              Register as Parking Owner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
