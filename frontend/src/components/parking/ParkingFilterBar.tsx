import React from 'react';
import { ParkingSearchFilters, ParkingType } from '../../types/parking.types';
import { VehicleType } from '../../types/user.types';
import { Search, Navigation, ArrowUpDown } from 'lucide-react';
import { Button } from '../common/Button';

interface ParkingFilterBarProps {
  filters: ParkingSearchFilters;
  onFilterChange: (newFilters: Partial<ParkingSearchFilters>) => void;
  onDetectLocation: () => void;
  isLocating?: boolean;
  onSearchLocation: (query: string) => void;
}

export const ParkingFilterBar: React.FC<ParkingFilterBarProps> = ({
  filters,
  onFilterChange,
  onDetectLocation,
  isLocating = false,
  onSearchLocation,
}) => {
  const [locationText, setLocationText] = React.useState(filters.locationQuery || '');
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle mb-6 space-y-3">
      {/* Top Search & Geolocation Row */}
      <form onSubmit={(event) => { event.preventDefault(); onSearchLocation(locationText); }} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            placeholder="Search by area, landmark, or street name (e.g. Cyber City, MG Road)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500 transition-colors"
          />
        </div>

        <Button type="submit" variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />} className="shrink-0">Search Area</Button>

        <Button
          type="button"
          variant="secondary"
          size="md"
          isLoading={isLocating}
          leftIcon={<Navigation className="w-4 h-4 text-brand-600" />}
          onClick={onDetectLocation}
          className="shrink-0"
        >
          Near Me
        </Button>
      </form>

      {/* Filter Badges and Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Radius:</span>
            <select value={filters.radiusKm ?? 5} onChange={(e) => onFilterChange({ radiusKm: Number(e.target.value) })} className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium">
              {[1, 2, 5, 10, 20, 50].map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
            </select>
          </div>
          {/* Vehicle Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Vehicle:</span>
            <select
              value={filters.vehicleType || ''}
              onChange={(e) =>
                onFilterChange({ vehicleType: (e.target.value || undefined) as VehicleType })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Vehicles</option>
              <option value="car">Standard Car / Sedan</option>
              <option value="suv">SUV / MUV</option>
              <option value="motorcycle">Two Wheeler / Bike</option>
              <option value="ev">Electric Vehicle (EV)</option>
            </select>
          </div>

          {/* Parking Structure Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={filters.parkingType || ''}
              onChange={(e) =>
                onFilterChange({ parkingType: (e.target.value || undefined) as ParkingType })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">All Parking Types</option>
              <option value="covered">Covered</option>
              <option value="uncovered">Uncovered</option>
              <option value="underground">Underground / Basement</option>
              <option value="multi-level">Multi-Level</option>
              <option value="driveway">Private Driveway</option>
            </select>
          </div>

          {/* Max Rate Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Max Rate:</span>
            <select
              value={filters.maxPrice || ''}
              onChange={(e) =>
                onFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Any Price</option>
              <option value="40">Under ₹40/hr</option>
              <option value="60">Under ₹60/hr</option>
              <option value="100">Under ₹100/hr</option>
            </select>
          </div>
        </div>

        {/* Sort Ordering */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Sort by:</span>
          <select
            value={filters.sortBy || 'distance'}
            onChange={(e) =>
              onFilterChange({ sortBy: e.target.value as ParkingSearchFilters['sortBy'] })
            }
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="distance">Nearest Distance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Customer Rating</option>
            <option value="capacity">Most Capacity Available</option>
          </select>
        </div>
      </div>
    </div>
  );
};
