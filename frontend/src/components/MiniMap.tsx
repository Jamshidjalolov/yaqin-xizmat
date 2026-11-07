import React, { useEffect, useRef } from 'react';
import { loadLeaflet, OSM_TILE_URL, OSM_ATTRIBUTION } from '../utils/leaflet';
import { LatLng } from '../utils/geo';

interface MiniMapProps {
  center: LatLng;
  userPos?: LatLng | null;
  height?: number;
  onClick?: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({ center, userPos, height = 190, onClick }) => {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !el.current || mapRef.current) return;
      const map = L.map(el.current, {
        zoomControl: false, dragging: true, scrollWheelZoom: false,
        doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, attributionControl: false
      }).setView([center.lat, center.lng], 15);
      mapRef.current = map;
      L.tileLayer(OSM_TILE_URL, { maxZoom: 19 }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      draw(L);
      setTimeout(() => map.invalidateSize(), 220);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (L && mapRef.current) {
      mapRef.current.setView([center.lat, center.lng], 15);
      draw(L);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, userPos?.lat, userPos?.lng]);

  const draw = (L: any) => {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    const pin = L.divIcon({
      className: 'yx-marker-wrap',
      html: `<div class="yx-marker yx-marker-dest"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span></div>`,
      iconSize: [40, 44], iconAnchor: [20, 42]
    });
    L.marker([center.lat, center.lng], { icon: pin, interactive: false }).addTo(layerRef.current);
    if (userPos) {
      const dot = L.divIcon({
        className: 'yx-user-wrap', html: '<div class="yx-user-dot"></div>',
        iconSize: [20, 20], iconAnchor: [10, 10]
      });
      L.marker([userPos.lat, userPos.lng], { icon: dot, interactive: false }).addTo(layerRef.current);
      L.polyline([[userPos.lat, userPos.lng], [center.lat, center.lng]], {
        color: '#10b981', weight: 3, opacity: 0.55, dashArray: '6 8'
      }).addTo(layerRef.current);
      const b = L.latLngBounds([[userPos.lat, userPos.lng], [center.lat, center.lng]]);
      mapRef.current?.fitBounds(b.pad(0.45));
    }
  };

  return (
    <div className="yx-minimap" style={{ height }} onClick={onClick}>
      <div ref={el} style={{ width: '100%', height: '100%' }} />
      <span className="yx-minimap-badge">{OSM_ATTRIBUTION.replace(/&copy;\s*/, '© ')}</span>
      {onClick && <span className="yx-minimap-hint">Bosib ko'ring</span>}
    </div>
  );
};

export default MiniMap;
