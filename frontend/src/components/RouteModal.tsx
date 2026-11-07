import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Clock, Route as RouteIcon, Crosshair, ExternalLink, Pointer } from 'lucide-react';
import { loadLeaflet, OSM_TILE_URL, OSM_ATTRIBUTION } from '../utils/leaflet';
import { BUKHARA_CENTER, LatLng, distanceMeters, formatDistance } from '../utils/geo';
import { fetchRoute, formatDuration, osmLink, RouteResult } from '../utils/route';

interface RouteModalProps {
  dest: LatLng;
  destName: string;
  origin: LatLng | null;
  onLocate: () => void;
  onClose: () => void;
}

export const RouteModal: React.FC<RouteModalProps> = ({ dest, destName, origin, onLocate, onClose }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [pickMode, setPickMode] = useState(false);
  const [manualOrigin, setManualOrigin] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const from = manualOrigin || origin || BUKHARA_CENTER;
  const isFallbackOrigin = !manualOrigin && !origin;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return;
      const map = L.map(mapEl.current, { zoomControl: false, scrollWheelZoom: true })
        .setView([from.lat, from.lng], 13);
      mapRef.current = map;
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION, maxZoom: 19 }).addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 220);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const L = (window as any).L;
    if (!L) return;

    routeLayerRef.current.clearLayers();
    markersRef.current = [];

    const destIcon = L.divIcon({
      className: 'yx-marker-wrap',
      html: `<div class="yx-marker yx-marker-dest"><span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></span></div>`,
      iconSize: [40, 44], iconAnchor: [20, 42]
    });
    const destMarker = L.marker([dest.lat, dest.lng], { icon: destIcon, zIndexOffset: 900 }).addTo(routeLayerRef.current);
    destMarker.bindTooltip(destName, { direction: 'top', offset: [0, -40], className: 'yx-tooltip' });
    markersRef.current.push(destMarker);

    const originIcon = L.divIcon({
      className: 'yx-marker-wrap',
      html: `<div class="yx-marker yx-marker-origin"><span><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg></span></div>`,
      iconSize: [40, 44], iconAnchor: [20, 42]
    });
    const originMarker = L.marker([from.lat, from.lng], { icon: originIcon }).addTo(routeLayerRef.current);
    originMarker.bindTooltip(
      manualOrigin ? 'Tanlangan joy' : origin ? 'Sizning joylashuvingiz' : 'Buxoro markazi',
      { direction: 'top', offset: [0, -40], className: 'yx-tooltip' }
    );
    markersRef.current.push(originMarker);

    let cancelled = false;
    setLoading(true);
    fetchRoute(from, dest, distanceMeters(from, dest.lat, dest.lng)).then((r) => {
      if (cancelled) return;
      setRoute(r);
      const line = L.polyline(r.path, { className: 'yx-route-line', color: '#10b981', weight: 6, opacity: 0.95, lineJoin: 'round', lineCap: 'round' });
      const halo = L.polyline(r.path, { color: '#047857', weight: 13, opacity: 0.22, lineJoin: 'round', lineCap: 'round' });
      halo.addTo(routeLayerRef.current);
      line.addTo(routeLayerRef.current);
      map.fitBounds(L.latLngBounds(r.path).pad(0.25));
    }).finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, dest.lat, dest.lng, from?.lat, from?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !pickMode) return;
    const handler = (e: any) => {
      setManualOrigin({ lat: e.latlng.lat, lng: e.latlng.lng });
      setPickMode(false);
    };
    map.on('click', handler);
    map.getContainer().style.cursor = 'crosshair';
    return () => {
      map.off('click', handler);
      map.getContainer().style.cursor = '';
    };
  }, [pickMode]);

  const chip = (icon: React.ReactNode, label: string) => (
    <div className="yx-stat-chip">
      <span className="yx-stat-icon">{icon}</span>
      <span>{label}</span>
    </div>
  );

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1400, padding: 0 }}>
      <div className="yx-route-modal" onClick={(e) => e.stopPropagation()}>
        <div className="yx-route-head">
          <div style={{ minWidth: 0 }}>
            <div className="yx-route-kicker">Yo'nalish</div>
            <div className="yx-route-title">{destName}</div>
          </div>
          <button className="yx-route-close" onClick={onClose} aria-label="Yopish">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div className="yx-route-stats">
          {chip(<RouteIcon style={{ width: 15, height: 15 }} />,
            route ? formatDistance(route.distance).replace(' uzoqda', '') : 'Hisoblanmoqda...')}
          {chip(<Clock style={{ width: 15, height: 15 }} />,
            route ? `${formatDuration(route.duration)} yo'l` : '...')}
          {chip(<MapPin style={{ width: 15, height: 15 }} />,
            route?.straightLine ? 'To\'g\'ridan-to\'g\'ri chiziq' : 'Avto yo\'li bo\'ylab')}
        </div>

        <div className="yx-route-mapwrap">
          <div ref={mapEl} className="yx-route-map" />
          {isFallbackOrigin && (
            <div className="yx-route-originbar">
              <span className="yx-route-originbar-text">
                Boshlan'ich: <b>Buxoro markazi</b>
              </span>
              <button className="yx-btn-light" onClick={onLocate}>
                <Crosshair style={{ width: 14, height: 14 }} /> Joylashuvimni aniqlash
              </button>
            </div>
          )}
          {loading && <div className="yx-route-loading"><span className="yx-spinner" /> Marshrut qurulmoqda...</div>}
        </div>

        <div className="yx-route-foot">
          <button
            className={pickMode ? 'yx-btn-solid yx-btn-solid-active' : 'yx-btn-solid'}
            onClick={() => setPickMode(p => !p)}
          >
            <Pointer style={{ width: 15, height: 15 }} />
            <span>{pickMode ? 'Xaritani bosib tanlang...' : 'Boshlan\'ich nuqtani tanlash'}</span>
          </button>
          <a
            className="yx-btn-outline"
            href={osmLink(from, dest)}
            target="_blank" rel="noreferrer"
          >
            <ExternalLink style={{ width: 15, height: 15 }} />
            <span>Xaritada ochish</span>
          </a>
          {manualOrigin && (
            <button className="yx-btn-text" onClick={() => setManualOrigin(null)}>Bekor qilish</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RouteModal;
