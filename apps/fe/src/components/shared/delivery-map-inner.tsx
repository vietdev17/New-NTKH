'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeliveryMapProps, MarkerData } from './delivery-map';

// ==========================================
// Custom icons
// ==========================================
const createIcon = (type: MarkerData['type']) => {
  if (type === 'shipper') {
    return L.divIcon({
      className: 'custom-marker-shipper',
      html: `<div style="
        width: 44px; height: 44px; position: relative;
      ">
        <div style="
          width: 44px; height: 44px; border-radius: 50%;
          background: #3B82F6; border: 3px solid white;
          box-shadow: 0 2px 12px rgba(59,130,246,0.5);
          display: flex; align-items: center; justify-content: center;
          animation: shipperPulse 2s ease-in-out infinite;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M19.15 8a2 2 0 0 0-1.72-1H15V5a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v10h2a3 3 0 0 0 6 0h4a3 3 0 0 0 6 0h2v-5l-2.85-3zM7 17a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm10 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </div>
        <div style="
          position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px;
          border-radius: 50%; border: 2px solid rgba(59,130,246,0.3);
          animation: shipperRing 2s ease-out infinite;
        "></div>
      </div>
      <style>
        @keyframes shipperPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shipperRing {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22],
    });
  }

  if (type === 'destination') {
    return L.divIcon({
      className: 'custom-marker-dest',
      html: `<div style="position: relative; width: 36px; height: 48px;">
        <svg width="36" height="48" viewBox="0 0 36 48">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z" fill="#EF4444"/>
          <circle cx="18" cy="18" r="8" fill="white"/>
          <circle cx="18" cy="18" r="4" fill="#EF4444"/>
        </svg>
      </div>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -48],
    });
  }

  // warehouse
  return L.divIcon({
    className: 'custom-marker-warehouse',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 8px;
      background: #10B981; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z"/>
      </svg>
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

// ==========================================
// OSRM routing - free, no API key
// ==========================================
async function fetchRoute(
  from: [number, number],
  to: [number, number],
): Promise<{ coords: [number, number][]; distance: number; duration: number } | null> {
  try {
    // OSRM expects [lng, lat]
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    // GeoJSON coords are [lng, lat], convert to [lat, lng] for Leaflet
    const coords: [number, number][] = route.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]] as [number, number],
    );
    return {
      coords,
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch {
    return null;
  }
}

// ==========================================
// Auto-fit bounds
// ==========================================
function FitBounds({ markers, routeCoords }: { markers: MarkerData[]; routeCoords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    const points: [number, number][] = [
      ...markers.map((m) => m.position),
      ...routeCoords,
    ];
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [60, 60] });
  }, [map, markers, routeCoords]);
  return null;
}

// ==========================================
// Route info overlay
// ==========================================
function RouteInfo({ distance, duration }: { distance: number; duration: number }) {
  const km = (distance / 1000).toFixed(1);
  const mins = Math.ceil(duration / 60);
  return (
    <div
      style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, background: 'white', borderRadius: 12,
        padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        display: 'flex', gap: 16, alignItems: 'center', fontSize: 13, fontWeight: 600,
      }}
    >
      <span style={{ color: '#3B82F6' }}>{km} km</span>
      <span style={{ color: '#6B7280' }}>~{mins} phut</span>
    </div>
  );
}

// ==========================================
// Main map component
// ==========================================
export default function DeliveryMapInner({
  markers,
  center,
  zoom,
  className = '',
  showRoute = false,
  onShipperClick,
}: DeliveryMapProps) {
  const mapCenter = center || (markers.length > 0 ? markers[0].position : [10.8231, 106.6297] as [number, number]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; duration: number } | null>(null);

  // Fetch real route from OSRM
  const shipperPos = useMemo(() => markers.find((m) => m.type === 'shipper')?.position, [markers]);
  const destPos = useMemo(() => markers.find((m) => m.type === 'destination')?.position, [markers]);

  useEffect(() => {
    if (!showRoute || !shipperPos || !destPos) {
      setRouteCoords([]);
      setRouteInfo(null);
      return;
    }

    let cancelled = false;
    fetchRoute(shipperPos, destPos).then((result) => {
      if (cancelled) return;
      if (result) {
        setRouteCoords(result.coords);
        setRouteInfo({ distance: result.distance, duration: result.duration });
      } else {
        // Fallback to straight line
        setRouteCoords([shipperPos, destPos]);
        setRouteInfo(null);
      }
    });

    return () => { cancelled = true; };
  }, [showRoute, shipperPos?.[0], shipperPos?.[1], destPos?.[0], destPos?.[1]]);

  return (
    <div className={`rounded-xl overflow-hidden border border-gray-200 relative ${className}`} style={{ height: '100%', minHeight: 300 }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom || 13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} routeCoords={routeCoords} />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createIcon(marker.type)}
            eventHandlers={
              marker.type === 'shipper' && onShipperClick
                ? { click: () => onShipperClick(marker.id) }
                : undefined
            }
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold">{marker.label}</p>
                {marker.popup && <p className="text-gray-500 mt-1">{marker.popup}</p>}
              </div>
            </Popup>
          </Marker>
        ))}

        {routeCoords.length >= 2 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#3B82F6', weight: 4, opacity: 0.8 }}
          />
        )}
      </MapContainer>

      {/* Route info overlay */}
      {routeInfo && <RouteInfo distance={routeInfo.distance} duration={routeInfo.duration} />}
    </div>
  );
}
