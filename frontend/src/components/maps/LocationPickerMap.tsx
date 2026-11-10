import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed, Search, CheckCircle2 } from 'lucide-react';
import { geocodingService, GeocodingResult } from '../../services/geocoding.service';
import { Button } from '../common/Button';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onConfirm: (location: { latitude: number; longitude: number; address: string }) => void;
  onSelectionChange?: (confirmed: boolean) => void;
}

const pinIcon = L.divIcon({ className: 'pin-marker', html: '<div style="width:26px;height:26px;background:#059669;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 3px 10px #0005"></div>', iconSize: [26, 26], iconAnchor: [13, 26] });
const mapTileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const MapClick: React.FC<{ onPosition: (pos: [number, number]) => void }> = ({ onPosition }) => {
  useMapEvents({ click: (event) => onPosition([event.latlng.lat, event.latlng.lng]) });
  return null;
};

const Recenter: React.FC<{ position: [number, number] | null }> = ({ position }) => {
  const map = useMap();
  useEffect(() => { if (position) map.setView(position, 16, { animate: true }); }, [map, position]);
  return null;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({ initialLat, initialLng, initialAddress = '', onConfirm, onSelectionChange }) => {
  const initialPosition = typeof initialLat === 'number' && typeof initialLng === 'number' ? [initialLat, initialLng] as [number, number] : null;
  const [position, setPosition] = useState<[number, number] | null>(initialPosition);
  const [address, setAddress] = useState(initialAddress);
  const [query, setQuery] = useState(initialAddress);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(Boolean(initialPosition));

  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
    setAddress(initialAddress);
    setQuery(initialAddress);
    setConfirmed(Boolean(initialPosition));
  }, [initialLat, initialLng, initialAddress]);

  const movePin = (next: [number, number]) => {
    setPosition(next);
    setConfirmed(false);
    onSelectionChange?.(false);
  };

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    setBusy(true); setError('');
    try { setResults(await geocodingService.search(query)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Address lookup failed.'); }
    finally { setBusy(false); }
  };

  const useGps = () => {
    setError('');
    if (!navigator.geolocation) { setError('This browser does not support location detection.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      const next: [number, number] = [coords.latitude, coords.longitude];
      movePin(next);
      try { const found = await geocodingService.reverse(...next); if (found) { setAddress(found); setQuery(found); } }
      catch { /* The coordinates can still be confirmed when reverse lookup is offline. */ }
      setBusy(false);
    }, (geoError) => {
      setBusy(false);
      setError(geoError.code === geoError.PERMISSION_DENIED ? 'Location permission was denied. Search an address or click the map to place the entrance.' : geoError.code === geoError.POSITION_UNAVAILABLE ? 'Your location is unavailable. Search an address or click the map to place the entrance.' : 'Location detection timed out. Search an address or click the map to place the entrance.');
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  };

  const confirm = async () => {
    if (!position) { setError('Search for an address, use GPS, or click the map to place the entrance pin.'); return; }
    setBusy(true); setError('');
    let selectedAddress = address;
    try { selectedAddress = (await geocodingService.reverse(position[0], position[1])) || selectedAddress; }
    catch { /* Keep the owner-entered address if reverse geocoding is unavailable. */ }
    setAddress(selectedAddress); setQuery(selectedAddress); setConfirmed(true);
    onSelectionChange?.(true);
    onConfirm({ latitude: Number(position[0].toFixed(6)), longitude: Number(position[1].toFixed(6)), address: selectedAddress });
    setBusy(false);
  };

  return <div className="space-y-3">
    <form onSubmit={searchAddress} className="flex gap-2">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search an address or landmark" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <Button type="submit" variant="secondary" size="sm" isLoading={busy} leftIcon={<Search className="h-4 w-4" />}>Search</Button>
      <Button type="button" variant="outline" size="sm" isLoading={busy} onClick={useGps} leftIcon={<LocateFixed className="h-4 w-4" />}>Use GPS</Button>
    </form>
    {results.length > 0 && <div className="max-h-36 space-y-1 overflow-auto rounded-lg border border-slate-200 p-1">{results.map((result, index) => <button type="button" key={`${result.latitude}:${result.longitude}:${index}`} onClick={() => { movePin([result.latitude, result.longitude]); setAddress(result.displayName); setQuery(result.displayName); setResults([]); }} className="block w-full rounded-md p-2 text-left text-xs hover:bg-emerald-50">{result.displayName}</button>)}</div>}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    <div className="relative h-72 w-full overflow-hidden rounded-xl border border-slate-300">
      <MapContainer center={position || [20, 0]} zoom={position ? 16 : 2} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <Recenter position={position} />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url={mapTileUrl} />
        <MapClick onPosition={movePin} />
        {position && <Marker position={position} icon={pinIcon} draggable eventHandlers={{ dragend: (event) => { const p = event.target.getLatLng(); movePin([p.lat, p.lng]); } }} />}
      </MapContainer>
    </div>
    {position ? <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
      <p className="font-mono text-slate-600">{address || 'Pinned entrance'} · {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
      <Button type="button" variant={confirmed ? 'secondary' : 'primary'} size="sm" isLoading={busy} onClick={confirm} leftIcon={<CheckCircle2 className="h-4 w-4" />}>{confirmed ? 'Confirm pin again' : 'Confirm entrance pin'}</Button>
    </div> : <p className="text-xs text-slate-500">Search for an address, use GPS, or zoom/pan and click the map. Pin the parking entrance, then confirm it.</p>}
    <p className="text-[11px] text-slate-500">Map and address data © OpenStreetMap contributors. Address lookup is sent only when you search or confirm a pin.</p>
  </div>;
};
