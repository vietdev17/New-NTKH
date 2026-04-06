'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

// Leaflet CSS must be imported
import 'leaflet/dist/leaflet.css';

import type { LatLngExpression } from 'leaflet';

// Default center: Ho Chi Minh City
const DEFAULT_CENTER: LatLngExpression = [10.8231, 106.6297];
const DEFAULT_ZOOM = 13;

interface MarkerData {
  id: string;
  position: [number, number];
  label: string;
  type: 'shipper' | 'destination' | 'warehouse';
  popup?: string;
}

interface DeliveryMapProps {
  markers: MarkerData[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  showRoute?: boolean;
  onShipperClick?: (id: string) => void;
}

// We need to dynamically import the map to avoid SSR issues
const MapInner = dynamic(() => import('./delivery-map-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 rounded-xl h-full min-h-[300px]">
      <div className="text-gray-400 text-sm">Loading map...</div>
    </div>
  ),
});

export default function DeliveryMap(props: DeliveryMapProps) {
  return <MapInner {...props} />;
}

export type { MarkerData, DeliveryMapProps };
