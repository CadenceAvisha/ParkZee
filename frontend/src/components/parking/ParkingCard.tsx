import React from 'react';
import { Link } from 'react-router-dom';
import { ParkingLocation } from '../../types/parking.types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Star, MapPin, ShieldCheck, Zap, Car, Eye } from 'lucide-react';

interface ParkingCardProps {
  location: ParkingLocation;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const ParkingCard: React.FC<ParkingCardProps> = ({
  location,
  isSelected = false,
  onSelect,
}) => {
  return (
    <Card
      onClick={onSelect}
      className={`transition-all duration-200 overflow-hidden ${
        isSelected ? 'ring-2 ring-brand-500 border-brand-500 shadow-md' : 'hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail Image */}
        <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-slate-100 overflow-hidden">
          <img
            src={location.photos[0] || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=500&q=80'}
            alt={location.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
              {location.parkingType}
            </span>
          </div>

          {location.distanceKm !== undefined && (
            <div className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
              <MapPin className="w-3 h-3 text-brand-600" />
              <span>{location.distanceKm.toFixed(1)} km away</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-600 leading-snug line-clamp-1">
                {location.name}
              </h3>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{location.rating > 0 ? location.rating.toFixed(1) : 'New'}</span>
                <span className="text-slate-400 font-normal">({location.reviewCount})</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 mb-3 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {location.address}, {location.city}
            </p>

            {/* Amenities pill preview */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {location.amenities.slice(0, 3).map((amenity) => (
                <span
                  key={amenity}
                  className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                >
                  {amenity}
                </span>
              ))}
              {location.amenities.length > 3 && (
                <span className="text-[10px] text-slate-400 self-center">
                  +{location.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Pricing & Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">₹{location.pricePerHour}</span>
                <span className="text-xs text-slate-500 font-medium">/ hour</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                {location.availableCapacity} slots available
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/parking/${location.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Details & Reserve
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
