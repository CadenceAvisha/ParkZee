import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { ParkingLocation } from '../../types/parking.types';
import { Button } from '../common/Button';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ParkingMapProps {
  locations: ParkingLocation[];
  selectedLocationId?: string | null;
  onSelectLocation?: (location: ParkingLocation) => void;
  center?: [number, number];
  zoom?: number;
  driverLocation?: { latitude: number; longitude: number; accuracy: number | null } | null;
  onChooseSearchLocation?: (latitude: number, longitude: number) => void;
}

const MapRecenter: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, zoom, { animate: true }); }, [center, zoom, map]);
  return null;
};

const MapLocationClick: React.FC<{ onChoose?: (latitude: number, longitude: number) => void }> = ({ onChoose }) => {
  useMapEvents({ click: (event) => {
    const target = event.originalEvent.target;
    if (target instanceof Element && target.closest('.leaflet-marker-icon, .leaflet-popup')) return;
    onChoose?.(event.latlng.lat, event.latlng.lng);
  } });
  return null;
};

const driverIcon = L.divIcon({ className: 'driver-map-marker', html: '<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 4px #2563eb55"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const priceIcon = (price: number, selected: boolean) => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="background:${selected ? '#047857' : '#0f172a'};color:white;padding:4px 8px;border-radius:9999px;font-weight:700;font-size:11px;box-shadow:0 4px 12px #0004;border:2px solid white;white-space:nowrap">₹${price}/hr</div>`,
  iconSize: [64, 28], iconAnchor: [32, 14],
});

export const ParkingMap: React.FC<ParkingMapProps> = ({
  locations, selectedLocationId, onSelectLocation, center = [20, 0], zoom = 2,
  driverLocation = null, onChooseSearchLocation,
}) => {
  const navigate = useNavigate();
  return <div className="relative z-0 h-full min-h-[420px] w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-subtle">
    <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
      <MapRecenter center={center} zoom={zoom} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={mapTileUrl} />
      <MapLocationClick onChoose={onChooseSearchLocation} />
      {driverLocation && <>
        {driverLocation.accuracy !== null && driverLocation.accuracy > 0 && <Circle center={[driverLocation.latitude, driverLocation.longitude]} radius={driverLocation.accuracy} pathOptions={{ color: '#2563eb', fillColor: '#60a5fa', fillOpacity: 0.12 }} />}
        <Marker position={[driverLocation.latitude, driverLocation.longitude]} icon={driverIcon}><Popup>{driverLocation.accuracy !== null ? `Your GPS location · accuracy ±${Math.round(driverLocation.accuracy)} m` : 'Selected search location'}</Popup></Marker>
      </>}
      {locations.filter((loc) => Number.isFinite(loc.location?.latitude) && Number.isFinite(loc.location?.longitude)).map((loc) => {
        const selected = selectedLocationId === loc.id;
        const destination = loc.entranceLocation || loc.location;
        return <Marker key={loc.id} position={[loc.location.latitude, loc.location.longitude]} icon={priceIcon(loc.pricePerHour, selected)} eventHandlers={{ click: () => onSelectLocation?.(loc) }}>
          <Popup className="custom-leaflet-popup"><div className="min-w-[220px] p-1">
            <div className="mb-1.5 flex items-center justify-between gap-2"><span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">{loc.parkingType}</span><div className="flex items-center gap-1 text-xs font-semibold text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /><span>{loc.rating > 0 ? loc.rating.toFixed(1) : 'New'}</span></div></div>
            <h4 className="mb-1 line-clamp-1 text-xs font-bold leading-snug text-slate-900">{loc.name}</h4>
            <p className="mb-1 line-clamp-2 text-[11px] text-slate-500">{loc.address}, {loc.city}</p>
            {loc.distanceKm !== undefined && <p className="mb-2 text-[11px] font-semibold text-emerald-800">{loc.distanceKm.toFixed(2)} km away</p>}
            <div className="mb-2 flex items-center justify-between border-t border-slate-100 py-1.5 text-xs"><span className="text-slate-500">Available:</span><span className="font-bold text-slate-900">{loc.availableCapacity} / {loc.totalCapacity} slots</span></div>
            {loc.ownerName && <p className="mb-2 text-[11px] text-slate-600">Host: {loc.ownerName}</p>}
            <Button size="sm" variant="primary" className="w-full text-xs" onClick={() => navigate(`/parking/${loc.id}`)}>View & Reserve</Button>
            <a className="mt-2 block rounded-md border border-slate-200 px-2 py-1.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}`}>Directions</a>
          </div></Popup>
        </Marker>;
      })}
    </MapContainer>
  </div>;
};
