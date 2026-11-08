import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

interface LocationPickerMapProps {
  initialLat?: number;
  initialLng?: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}

const pinIcon = L.divIcon({
  className: 'pin-marker',
  html: `
    <div style="
      background-color: #059669;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg) translate(-50%, -50%);
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const LocationClickMarker: React.FC<{
  position: [number, number];
  onPositionChange: (pos: [number, number]) => void;
}> = ({ position, onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  return <Marker position={position} icon={pinIcon} />;
};

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  initialLat = 28.4986,
  initialLng = 77.0878,
  onChange,
}) => {
  const [position, setPosition] = useState<[number, number]>([initialLat, initialLng]);

  useEffect(() => {
    setPosition([initialLat, initialLng]);
  }, [initialLat, initialLng]);

  const handlePositionChange = (pos: [number, number]) => {
    setPosition(pos);
    onChange({ latitude: Number(pos[0].toFixed(6)), longitude: Number(pos[1].toFixed(6)) });
  };

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden border border-slate-300 relative">
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationClickMarker position={position} onPositionChange={handlePositionChange} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 shadow-xs">
        Pin: {position[0].toFixed(5)}, {position[1].toFixed(5)} (Click map to reposition)
      </div>
    </div>
  );
};
