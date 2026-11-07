import React, { useEffect, useRef } from 'react';
import { Service } from '../api';
import { BUKHARA_CENTER, LatLng } from '../utils/geo';
import { loadLeaflet, OSM_TILE_URL, OSM_ATTRIBUTION } from '../utils/leaflet';
import { pinHtml } from '../utils/categoryIcons';

interface MapViewProps {
  services: Service[];
  userPos: LatLng | null;
  onSelect: (service: Service) => void;
  onDirections: (service: Service) => void;
}

export const MapView: React.FC<MapViewProps> = ({ services, userPos, onSelect, onDirections }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const cbRef = useRef({ onSelect, onDirections });
  cbRef.current = { onSelect, onDirections };

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true })
        .setView([BUKHARA_CENTER.lat, BUKHARA_CENTER.lng], 13);
      mapRef.current = map;
      L.tileLayer(OSM_TILE_URL, {
        attribution: OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      const syncZoomClass = () => {
        map.getContainer().classList.toggle('yx-zoom-far', map.getZoom() < 14);
      };
      map.on('zoomend', syncZoomClass);
      syncZoomClass();
      renderMarkers(L);
    }).catch(() => { /* leaflet yuklanmasa xarita ko'rsatilmaydi */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMarkers = (L: any) => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    const pts: [number, number][] = [];

    services.forEach((s) => {
      const lat = parseFloat(String(s.lat));
      const lng = parseFloat(String(s.lng));
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      pts.push([lat, lng]);
      const icon = L.divIcon({
        className: 'yx-pin-wrap',
        html: pinHtml(s.category),
        iconSize: [40, 48],
        iconAnchor: [20, 46],
        popupAnchor: [0, -44],
      });
      const price = s.price && s.price > 0 ? `${s.price.toLocaleString()} so'm` : 'Kelishilgan';
      const marker = L.marker([lat, lng], { icon }).addTo(layerRef.current);
      marker.bindPopup(
        `<div class="yx-popup">
           <div class="yx-popup-cat">${s.category}</div>
           <div class="yx-popup-title">${s.title}</div>
           <div class="yx-popup-price">${price}</div>
           <div class="yx-popup-actions">
             <button class="yx-popup-route" data-sid="${s.id}">Yo'l ko'rsatish</button>
             <button class="yx-popup-btn" data-sid="${s.id}">Batafsil</button>
           </div>
         </div>`
      );
    });

    if (userPos) {
      const userIcon = L.divIcon({
        className: 'yx-user-wrap',
        html: `<div class="yx-user-dot"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      L.marker([userPos.lat, userPos.lng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(layerRef.current)
        .bindPopup('<b>Siz shu yerdasiz</b>');
      pts.push([userPos.lat, userPos.lng]);
    }

    if (pts.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(pts).pad(0.2));
    } else if (pts.length === 1) {
      mapRef.current.setView(pts[0], 15);
    }
  };

  useEffect(() => {
    const L = (window as any).L;
    if (L) renderMarkers(L);
    // popup tugmalari orqali tanlash / yo'nalish ochish
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const btn = target?.closest?.('[data-sid]') as HTMLElement | null;
      if (!btn) return;
      const svc = services.find(s => s.id === Number(btn.getAttribute('data-sid')));
      if (!svc) return;
      if (btn.classList.contains('yx-popup-route')) cbRef.current.onDirections(svc);
      else cbRef.current.onSelect(svc);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services, userPos]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 420, borderRadius: 20, overflow: 'hidden' }} />;
};
