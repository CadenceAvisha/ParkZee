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
import { MapPin, SlidersHorizontal, Map as MapIcon, List as ListIcon } from 'lucide-react';
import { VehicleType } from '../../types/user.types';

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
  });

  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.4986, 77.0878]);
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'map'>('list');

  // Fetch parking based on filters
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoading(true);
      try {
        const results = await parkingService.searchParking(filters);
        setLocations(results);
        if (results.length > 0 && !selectedLocation) {
          setSelectedLocation(results[0]);
          setMapCenter([results[0].location.latitude, results[0].location.longitude]);
        }
      } catch (err) {
        showToast('error', 'Search Error', 'Unable to retrieve parking locations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, [filters, showToast]);

  const handleFilterChange = (newFilters: Partial<ParkingSearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Browser Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation Unsupported', 'Your browser does not support GPS location.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        handleFilterChange({ latitude, longitude });
        setIsLocating(false);
        showToast('success', 'Location Detected', 'Showing nearest parking facilities.');
      },
      (error) => {
        setIsLocating(false);
        showToast(
          'info',
          'Location Access Denied',
          'Please type your destination address in the search box above.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
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
        onDetectLocation={handleDetectLocation}
        isLocating={isLocating}
      />

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
              description="No approved parking matches your current search filters. Try widening your price range or vehicle filter."
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
            zoom={13}
          />
        </div>
      </div>
    </div>
  );
};
