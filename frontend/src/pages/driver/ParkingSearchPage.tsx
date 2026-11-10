import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parkingService } from '../../services/parking.service';
import { ParkingLocation, ParkingSearchFilters } from '../../types/parking.types';
import { ParkingFilterBar } from '../../components/parking/ParkingFilterBar';
import { ParkingCard } from '../../components/parking/ParkingCard';
import { ParkingMap } from '../../components/maps/ParkingMap';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotification } from '../../context/NotificationContext';
import { MapPin, Map as MapIcon, List as ListIcon, LocateFixed } from 'lucide-react';
import { VehicleType } from '../../types/user.types';
import { geocodingService } from '../../services/geocoding.service';

export const ParkingSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useNotification();

  const [filters, setFilters] = useState<ParkingSearchFilters>({
    locationQuery: searchParams.get('q') || '',
    vehicleType: (searchParams.get('vehicle') as VehicleType) || undefined,
    date: searchParams.get('date') || undefined,
    startTime: searchParams.get('start') || undefined,
    endTime: searchParams.get('end') || undefined,
    sortBy: 'distance',
    radiusKm: 5,
  });

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, 0]);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [locationMessage, setLocationMessage] = useState('Requesting your location. You can search for an address or click the map if GPS is unavailable.');
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'map'>('list');

  // Fetch parking based on filters
  useEffect(() => {
    let active = true;
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        if (filters.latitude === undefined || filters.longitude === undefined) {
          if (active) setLocations([]);
          return;
        }
        const results = await parkingService.searchParking({ ...filters, radiusKm: filters.radiusKm ?? 5 });
        if (active) {
          setLocations(results);
          setSelectedLocation((current) => current && results.some((item) => item.id === current.id) ? current : results[0] ?? null);
        }
      } catch (err) {
        if (active) showToast('error', 'Search Error', 'Unable to retrieve parking locations.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchLocations();
    return () => { active = false; };
  }, [filters, showToast]);

  const handleFilterChange = (newFilters: Partial<ParkingSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage('This browser does not support location detection. Search an address or click the map to set a location.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setDriverLocation({ latitude, longitude, accuracy });
        setMapCenter([latitude, longitude]);
        setFilters((prev) => ({ ...prev, locationQuery: '', latitude, longitude }));
        setIsLocating(false);
        setLocationMessage(`Current location detected (accuracy ±${Math.round(accuracy)} m). Showing available parking within ${filters.radiusKm ?? 5} km.`);
      },
      (error) => {
        setIsLocating(false);
        const message = error.code === error.PERMISSION_DENIED ? 'Location permission was denied. Search an address or click the map to choose a search point.' : error.code === error.POSITION_UNAVAILABLE ? 'Your position is unavailable. Search an address or click the map to choose a search point.' : 'Location detection timed out. Search an address or click the map to choose a search point.';
        setLocationMessage(message);
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  useEffect(() => { requestCurrentLocation(); }, []);

  const handleSearchLocation = async (query: string) => {
    if (!query.trim()) return;
    setIsLocating(true);
    try {
      const candidates = await geocodingService.search(query);
      if (!candidates.length) { setLocationMessage('No matching address found. Try a more specific address or click the map.'); return; }
      const selected = candidates[0];
      setDriverLocation(null);
      setMapCenter([selected.latitude, selected.longitude]);
      setFilters((prev) => ({ ...prev, locationQuery: '', latitude: selected.latitude, longitude: selected.longitude }));
      setLocationMessage(`Search location: ${selected.displayName}. Adjust it by clicking the map, or use Near Me for GPS.`);
    } catch (err) {
      setLocationMessage(err instanceof Error ? err.message : 'Address search failed. Click the map to select a location.');
    } finally { setIsLocating(false); }
  };

  const handleMapLocation = (latitude: number, longitude: number) => {
    setDriverLocation({ latitude, longitude, accuracy: null });
    setMapCenter([latitude, longitude]);
    setFilters((prev) => ({ ...prev, locationQuery: '', latitude, longitude }));
    setLocationMessage('Manual search point selected from the map.');
  };

  const handleSelectLocation = (loc: ParkingLocation) => {
    setSelectedLocation(loc);
    setMapCenter([loc.location.latitude, loc.location.longitude]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Filter Bar */}
      <ParkingFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onDetectLocation={requestCurrentLocation}
        onSearchLocation={handleSearchLocation}
        isLocating={isLocating}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-900">
        <p>{locationMessage}{driverLocation?.accuracy ? ` GPS accuracy ±${Math.round(driverLocation.accuracy)} m.` : ''}</p>
        <button type="button" disabled={!driverLocation} onClick={() => driverLocation && setMapCenter([driverLocation.latitude, driverLocation.longitude])} className="inline-flex items-center gap-1 font-semibold disabled:opacity-50"><LocateFixed className="h-3.5 w-3.5" /> Recenter</button>
      </div>

      {/* Mobile Tab Toggle (List vs Map) */}
      <div className="lg:hidden flex items-center justify-center p-1 bg-slate-200/80 rounded-xl mb-4">
        <button
          onClick={() => setMobileViewTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileViewTab === 'list'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListIcon className="w-4 h-4" />
          <span>Listings ({locations.length})</span>
        </button>
        <button
          onClick={() => setMobileViewTab('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileViewTab === 'map'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Map View</span>
        </button>
      </div>

      {/* Main Split Layout: Left List Cards, Right Interactive Leaflet Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Listings List */}
        <div
          className={`lg:col-span-7 space-y-4 ${
            mobileViewTab === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-900">
              {locations.length} {locations.length === 1 ? 'Parking Spot' : 'Parking Facilities'}{' '}
              Available
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Verified & Open for Direct Reservation
            </span>
          </div>

          {isLoading ? (
            <LoadingSkeleton count={4} className="h-44 w-full" />
          ) : locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Parking Spaces Found"
              description={filters.latitude === undefined ? 'Set your location with GPS, search an address, or click the map to find available parking nearby.' : 'No approved parking with bookable capacity was found in this radius. Try a larger search radius.'}
              actionText="Reset All Filters"
              onAction={() =>
                setFilters({
                  locationQuery: '',
                  sortBy: 'distance',
                })
              }
            />
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <ParkingCard
                  key={location.id}
                  location={location}
                  isSelected={selectedLocation?.id === location.id}
                  onSelect={() => handleSelectLocation(location)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Leaflet Map */}
        <div
          className={`lg:col-span-5 lg:sticky lg:top-24 h-[550px] lg:h-[calc(100vh-140px)] ${
            mobileViewTab === 'list' ? 'hidden lg:block' : 'block'
          }`}
        >
          <ParkingMap
            locations={locations}
            selectedLocationId={selectedLocation?.id}
            onSelectLocation={handleSelectLocation}
            center={mapCenter}
            zoom={filters.latitude === undefined ? 2 : 14}
            driverLocation={driverLocation}
            onChooseSearchLocation={handleMapLocation}
          />
        </div>
      </div>
    </div>
  );
};
