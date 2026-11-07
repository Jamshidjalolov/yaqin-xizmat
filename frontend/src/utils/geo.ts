export interface LatLng {
  lat: number;
  lng: number;
}

// Haversine masofasi (metr)
export const distanceMeters = (a: LatLng, bLat: number, bLng: number): number => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - a.lat);
  const dLng = toRad(bLng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m uzoqda`;
  return `${(meters / 1000).toFixed(1)} km uzoqda`;
};

export const BUKHARA_CENTER: LatLng = { lat: 39.7747, lng: 64.4286 };
