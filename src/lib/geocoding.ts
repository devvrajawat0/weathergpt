import { GeoLocation } from '@/types/weather';

export const DEFAULT_LOCATION: GeoLocation = {
  id: 1270584,
  name: 'Gwalior',
  latitude: 26.2235,
  longitude: 78.1792,
  country: 'India',
  country_code: 'IN',
  admin1: 'Madhya Pradesh',
  admin2: 'Gwalior District',
};

/**
 * Searches city/district lat/lon via Open-Meteo Geocoding API
 * Never hardcodes city output. Runs fresh on every query.
 */
export async function geocodeCity(query: string): Promise<GeoLocation[]> {
  if (!query || query.trim().length === 0) return [DEFAULT_LOCATION];

  const cleanQuery = query.trim();
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    cleanQuery
  )}&count=10&language=en&format=json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding service unavailable');

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((item: any) => ({
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      country: item.country || '',
      country_code: item.country_code || '',
      admin1: item.admin1 || '',
      admin2: item.admin2 || '',
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

/**
 * Detects user location by IP lookup or defaults to Gwalior, MP, India
 */
export async function detectUserLocation(): Promise<GeoLocation> {
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.latitude && data.longitude) {
        return {
          id: Date.now(),
          name: data.city || 'My Location',
          latitude: data.latitude,
          longitude: data.longitude,
          country: data.country_name || 'India',
          country_code: data.country_code || 'IN',
          admin1: data.region || '',
        };
      }
    }
  } catch (e) {
    console.warn('IP location lookup failed, using default Gwalior', e);
  }

  // Backup fallback IP API
  try {
    const res2 = await fetch('http://ip-api.com/json/', { cache: 'no-store' });
    if (res2.ok) {
      const data2 = await res2.json();
      if (data2.lat && data2.lon) {
        return {
          id: Date.now(),
          name: data2.city || 'My Location',
          latitude: data2.lat,
          longitude: data2.lon,
          country: data2.country || 'India',
          country_code: data2.countryCode || 'IN',
          admin1: data2.regionName || '',
        };
      }
    }
  } catch (e2) {
    console.warn('Backup IP API failed, defaulting to Gwalior');
  }

  return DEFAULT_LOCATION;
}
