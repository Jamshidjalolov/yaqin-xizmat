import { LatLng } from './geo';

export interface RouteResult {
  path: [number, number][];
  distance: number;
  duration: number;
  straightLine: boolean;
}

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const cache = new Map<string, RouteResult>();

const keyOf = (from: LatLng, to: LatLng) =>
  `${from.lat.toFixed(4)},${from.lng.toFixed(4)}>${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;

const straightLine = (from: LatLng, to: LatLng, meters: number): RouteResult => ({
  path: [[from.lat, from.lng], [to.lat, to.lng]],
  distance: meters,
  duration: meters / 5.5,
  straightLine: true
});

export const fetchRoute = async (from: LatLng, to: LatLng, fallbackMeters: number): Promise<RouteResult> => {
  const key = keyOf(from, to);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `${OSRM}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) throw new Error('no route');
    const result: RouteResult = {
      path: route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]] as [number, number]),
      distance: route.distance,
      duration: route.duration,
      straightLine: false
    };
    cache.set(key, result);
    return result;
  } catch {
    return straightLine(from, to, fallbackMeters);
  }
};

export const formatDuration = (seconds: number): string => {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} soat ${m} daq` : `${h} soat`;
};

export const osmLink = (from: LatLng, to: LatLng): string =>
  `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${from.lat},${from.lng};${to.lat},${to.lng}#map=14/${from.lat}/${from.lng}`;

export const osmMarkerLink = (lat: string | number, lng: string | number): string =>
  `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
