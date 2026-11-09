import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CarFront, Clock3, MapPin, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ParkingCard } from '../../components/parking/ParkingCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation } from '../../types/parking.types';
import heroImage from '../../assets/hero.png';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    parkingService.searchParking({ sortBy: 'rating' })
      .then((results) => setLocations(results.slice(0, 3)))
      .catch(() => setLocations([]))
      .finally(() => setLoading(false));
  }, []);

  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    navigate(`/search${params.size ? `?${params}` : ''}`);
  };

  return (
    <div className="pb-20">
      <section className="border-b border-stone-200 bg-[#f4f3ed]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-semibold tracking-wide text-emerald-800">Parking, sorted.</p>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-stone-950 sm:text-6xl">A good spot makes the whole trip easier.</h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-stone-600">Find a space near where you’re going, reserve it ahead of time, and pay the owner when you arrive.</p>
            <form onSubmit={search} className="mt-8 flex max-w-lg flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm sm:flex-row">
              <label className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <MapPin className="h-5 w-5 shrink-0 text-emerald-700" />
                <span className="sr-only">Area or destination</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Where are you headed?" className="h-12 w-full border-0 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400 focus:ring-0" />
              </label>
              <Button type="submit" variant="primary" size="md" className="h-12 px-6">Find parking <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            <p className="mt-3 text-xs text-stone-500">Browse available spaces before you book.</p>
          </div>
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <img src={heroImage} alt="A car parked in a calm, tree-lined city street" className="h-[300px] w-full rounded-[2rem] object-cover sm:h-[390px]" />
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-md sm:left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><CarFront className="h-5 w-5" /></span>
              <span><span className="block text-sm font-semibold text-stone-900">Your space, held</span><span className="block text-xs text-stone-500">Pay directly on arrival</span></span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-20 sm:px-8">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><p className="text-sm font-medium text-emerald-800">A place to start</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">Parking people have listed nearby</h2></div>
          <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">See all spaces <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? <LoadingSkeleton count={3} className="h-64 w-full" /> : locations.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{locations.map((location) => <ParkingCard key={location.id} location={location} />)}</div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-10 text-center"><MapPin className="mx-auto h-7 w-7 text-stone-400" /><h3 className="mt-3 font-semibold text-stone-900">No spaces to feature just yet</h3><p className="mt-1 text-sm text-stone-600">Search another area or check back soon.</p><Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/search')}>Browse the map</Button></div>
        )}
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-5 sm:px-8">
        <div className="rounded-3xl bg-stone-950 px-6 py-10 text-white sm:px-10 sm:py-12">
          <div className="max-w-xl"><p className="text-sm font-medium text-emerald-300">Straightforward from start to finish</p><h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Reserve now. Settle up when you get there.</h2></div>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div><MapPin className="h-5 w-5 text-emerald-300" /><h3 className="mt-3 font-semibold">Choose a space</h3><p className="mt-1 text-sm leading-6 text-stone-300">Compare location, hourly price, and the details that matter to you.</p></div>
            <div><Clock3 className="h-5 w-5 text-emerald-300" /><h3 className="mt-3 font-semibold">Reserve your time</h3><p className="mt-1 text-sm leading-6 text-stone-300">Book a spot for your visit without paying online upfront.</p></div>
            <div><ShieldCheck className="h-5 w-5 text-emerald-300" /><h3 className="mt-3 font-semibold">Arrive and pay directly</h3><p className="mt-1 text-sm leading-6 text-stone-300">Pay the parking owner on arrival and show your booking for entry.</p></div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 flex max-w-7xl flex-col gap-5 border-t border-stone-200 px-5 pt-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div><h2 className="text-xl font-semibold text-stone-950">Have a space that sits empty?</h2><p className="mt-1 text-sm text-stone-600">List it and manage reservations in one place.</p></div>
        <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-950">Become a parking host <ArrowRight className="h-4 w-4" /></Link>
      </section>
    </div>
  );
};
