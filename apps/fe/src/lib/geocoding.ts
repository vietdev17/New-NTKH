// LocationIQ Geocoding API - Free tier
const LOCATIONIQ_API_KEY = 'pk.4645bb084fb26ed3af89b701c55365b4';
const LOCATIONIQ_SEARCH_ENDPOINT = 'https://us1.locationiq.com/v1/search';
const LOCATIONIQ_STRUCTURED_ENDPOINT = 'https://us1.locationiq.com/v1/search/structured';

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  street: string;
  ward: string;
  district: string;
  province: string;
}

/**
 * Geocode a Vietnamese address to lat/lng using LocationIQ
 */
export async function geocodeAddress(address: {
  street?: string;
  ward?: string;
  district?: string;
  province?: string;
}): Promise<GeocodingResult | null> {
  try {
    if (!address.street && !address.ward && !address.district && !address.province) {
      return null;
    }

    // Try structured search first (more accurate for Vietnam)
    const params = new URLSearchParams();
    params.set('key', LOCATIONIQ_API_KEY);
    params.set('format', 'json');
    params.set('addressdetails', '1');
    params.set('countrycodes', 'vn');

    // Add available components
    if (address.street) params.set('street', address.street);
    if (address.district) params.set('county', address.district);
    if (address.province) params.set('state', address.province);

    let response = await fetch(`${LOCATIONIQ_STRUCTURED_ENDPOINT}?${params}`);
    let data = await response.json();

    // If no results, try free-form search
    if (!data || data.length === 0) {
      const fullAddress = [
        address.street,
        address.ward,
        address.district,
        address.province,
      ].filter(Boolean).join(', ');

      const freeFormParams = new URLSearchParams();
      freeFormParams.set('key', LOCATIONIQ_API_KEY);
      freeFormParams.set('q', fullAddress);
      freeFormParams.set('format', 'json');
      freeFormParams.set('addressdetails', '1');
      freeFormParams.set('countrycodes', 'vn');

      response = await fetch(`${LOCATIONIQ_SEARCH_ENDPOINT}?${freeFormParams}`);
      data = await response.json();
    }

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];
    const addr = result.address || {};

    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
      street: addr.road || address.street || '',
      ward: addr.neighbourhood || addr.suburb || address.ward || '',
      district: addr.county || address.district || '',
      province: addr.state || address.province || '',
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
