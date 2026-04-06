'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';
import { shipperService } from '@/services/shipper.service';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
}

interface UseGeolocationOptions {
  enableSocket?: boolean;
  currentOrderId?: string | null;
  intervalMs?: number; // how often to send updates (default 10s)
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { enableSocket = true, currentOrderId = null, intervalMs = 10000 } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    isTracking: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);

  const sendLocation = useCallback(
    (lat: number, lng: number) => {
      const now = Date.now();
      if (now - lastSentRef.current < intervalMs) return;
      lastSentRef.current = now;

      // Send via socket for realtime
      if (enableSocket) {
        const socket = getSocket();
        if (socket?.connected) {
          socket.emit('shipper:update_location', {
            lat,
            lng,
            currentOrderId,
          });
        }
      }

      // Also send via REST as fallback
      shipperService.updateLocation(lat, lng).catch(() => {});
    },
    [enableSocket, currentOrderId, intervalMs],
  );

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Trình duyệt không hỗ trợ GPS' }));
      return;
    }

    setState((s) => ({ ...s, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setState({
          latitude,
          longitude,
          accuracy,
          error: null,
          isTracking: true,
        });
        sendLocation(latitude, longitude);
      },
      (error) => {
        let msg = 'Lỗi GPS không xác định';
        if (error.code === 1) msg = 'Bạn chưa cấp quyền truy cập vị trí';
        else if (error.code === 2) msg = 'Không thể xác định vị trí';
        else if (error.code === 3) msg = 'Hết thời gian chờ GPS';
        setState((s) => ({ ...s, error: msg, isTracking: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }, [sendLocation]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((s) => ({ ...s, isTracking: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
