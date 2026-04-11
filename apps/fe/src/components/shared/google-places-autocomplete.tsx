'use client';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PlaceResult {
  description: string;
  place_id: string;
  lat: number;
  lng: number;
  street: string;
  ward: string;
  district: string;
  province: string;
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

export function GooglePlacesAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Nhập địa chỉ...',
  className,
  disabled,
}: GooglePlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionTokenRef = useRef<any>(null);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'your-api-key') {
      console.warn('Google Maps API key not configured');
      return;
    }

    if (window.google?.maps?.places) {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
      return;
    }

    window.initGooglePlaces = () => {
      sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=initGooglePlaces`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!window.google?.maps?.places || !input.length) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const request = { input, sessionToken: sessionTokenRef.current };

      service.getPlacePredictions(request, (predictions: any[], status: any) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
      });
    } catch {
      setLoading(false);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length > 2) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  const getPlaceDetails = (placeId: string, description: string) => {
    if (!window.google?.maps?.places) return;

    const map = new window.google.maps.Map(document.createElement('div'));
    const service = new window.google.maps.places.PlacesService(map);

    service.getDetails(
      {
        placeId,
        fields: ['address_components', 'geometry'],
        sessionToken: sessionTokenRef.current,
      },
      (place: any, status: any) => {
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return;

        const { geometry, address_components } = place;
        const lat = geometry?.location?.lat();
        const lng = geometry?.location?.lng();

        // Parse address components
        let street = '', ward = '', district = '', province = '';

        address_components.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            street = component.long_name + ' ' + street;
          }
          if (types.includes('route')) {
            street += component.long_name;
          }
          if (types.includes('sublocality_level_1')) {
            ward = component.long_name;
          }
          if (types.includes('administrative_area_level_2')) {
            district = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            province = component.long_name;
          }
        });

        // Reset session token
        sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();

        onSelect({
          description,
          place_id: placeId,
          lat,
          lng,
          street: street.trim(),
          ward,
          district,
          province,
        });
      }
    );
  };

  const handleSelect = (suggestion: any) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    getPlaceDetails(suggestion.place_id, suggestion.description);
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(showSuggestions && suggestions.length > 0 && 'rounded-b-none border-b-0', className)}
        disabled={disabled || !GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'your-api-key'}
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full bg-white border border-t-0 rounded-b-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.place_id}
              onClick={() => handleSelect(suggestion)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm border-b last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">📍</span>
                <div>
                  <p className="font-medium">{suggestion.structured_formatting?.main_text}</p>
                  <p className="text-xs text-gray-500">{suggestion.structured_formatting?.secondary_text}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {(!GOOGLE_MAPS_KEY || GOOGLE_MAPS_KEY === 'your-api-key') && (
        <p className="text-xs text-gray-400 mt-1">Google Maps API key chưa được cấu hình</p>
      )}
    </div>
  );
}
