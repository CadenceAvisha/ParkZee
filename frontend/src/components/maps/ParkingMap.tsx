import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ParkingLocation } from '../../types/parking.types';
import { Button } from '../common/Button';
import { Car, Star, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ParkingMapProps {
  locations: ParkingLocation[];
  selectedLocationId?: string | null;
  onSelectLocation?: (location: ParkingLocation) => void;
  center?: [number, number];
  zoom?: number;
}

// Helper component to smoothly pan/zoom when center or selected location changes
const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

// Create custom modern HTML pin
const createCustomPriceIcon = (price: number, isSelected: boolean) => {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${isSelected ? '#047857' : '#0f172a'};
        color: white;
        padding: 4px 8px;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 11px;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid white;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 2px;
        transform: translate(-50%, -50%);
        transition: all 0.2s;
        cursor: pointer;
      ">
        <span>₹${price}/hr</span>
      </div>
    `,
    iconSize: [50, 24],
    iconAnchor: [25, 12],
  });
};

export const ParkingMap: React.FC<ParkingMapProps> = ({
  locations,
  selectedLocationId,
  onSelectLocation,
  center = [28.48, 77.08], // Default to Delhi NCR / Gurugram hub
  zoom = 13,
}) => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200/80 shadow-subtle relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapRecenter center={center} zoom={zoom} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {locations.map((loc) => {
          const isSelected = selectedLocationId === loc.id;
          return (
            <Marker
              key={loc.id}
              position={[loc.location.latitude, loc.location.longitude]}
              icon={createCustomPriceIcon(loc.pricePerHour, isSelected)}
              eventHandlers={{
                click: () => onSelectLocation && onSelectLocation(loc),
              }}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-1 min-w-[220px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {loc.parkingType}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-semibold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{loc.rating > 0 ? loc.rating.toFixed(1) : 'New'}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-1 mb-1">
                    {loc.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{loc.address}</p>

                  <div className="flex items-center justify-between text-xs py-1.5 border-t border-slate-100 mb-2">
                    <span className="text-slate-500">Available:</span>
                    <span className="font-bold text-slate-900">
                      {loc.availableCapacity} / {loc.totalCapacity} slots
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full text-xs py-1.5"
                    onClick={() => navigate(`/parking/${loc.id}`)}
                  >
                    View & Reserve
                  </Button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
