import React from 'react';
import { Star, MapPin, UserCheck, ArrowRight, Navigation } from 'lucide-react';
import { Service, trackServiceViewApi } from '../api';
import { Language, translations } from '../i18n';
import { formatDistance } from '../utils/geo';
import IconChip from './IconChip';

interface ServiceCardProps {
  lang: Language;
  service: Service;
  distanceMeters?: number;
  rank?: number;
  onSelect: (service: Service) => void;
  onDirections?: (service: Service) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Dorixona': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80',
  'Santexnika': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80',
  'Elektrik': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'Go\'zallik': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'Tozalash': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'Ta\'lim': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
  'Avto': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'
};

export const ServiceCard: React.FC<ServiceCardProps> = ({ lang, service, distanceMeters, rank = 0, onSelect, onDirections }) => {
  const t = translations[lang];
  const defaultImage = CATEGORY_IMAGES[service.category] || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80";
  const displayImage = service.image_url || defaultImage;

  const handleClick = () => {
    trackServiceViewApi(service.id);
    onSelect(service);
  };

  return (
    <div className="service-card card-stagger" onClick={handleClick} style={{ cursor: 'pointer', animationDelay: `${Math.min(rank, 12) * 45}ms` }}>
      <div style={{ position: 'relative', height: '190px', width: '100%', overflow: 'hidden' }}>
        <img
          className="service-card-img"
          src={displayImage}
          alt={service.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(2,6,20,0.55) 0%, transparent 45%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#f59e0b' }}>
          <Star style={{ width: '14px', height: '14px', fill: '#f59e0b' }} />
          <span>{service.rating ? service.rating.toFixed(1) : '4.8'}</span>
        </div>
        {typeof distanceMeters === 'number' && (
          <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(16,185,129,0.92)', backdropFilter: 'blur(8px)', padding: '4px 11px', borderRadius: '9999px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', fontWeight: 800, color: '#04121c', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' }}>
            <Navigation style={{ width: '13px', height: '13px' }} />
            <span>{formatDistance(distanceMeters)}</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: '#047857', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>
          {service.category}
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', lineHeight: 1.35 }}>
          {service.title}
        </h3>

        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
          {service.description}
        </p>

        <div style={{ marginTop: 'auto' }}>
          <div className="yx-card-meta">
            <IconChip size="sm" tone="rose" icon={<MapPin style={{ width: 14, height: 14 }} />} />
            <span className="yx-card-meta-text">{service.location}</span>
          </div>

          <div className="yx-card-meta">
            <IconChip size="sm" tone="sky" icon={<UserCheck style={{ width: 14, height: 14 }} />} />
            <span className="yx-card-meta-text">{service.provider_name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block' }}>{t.priceStarting}</span>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#10b981' }}>
                {service.price && service.price > 0 ? `${service.price.toLocaleString()} so'm` : 'Kelishilgan'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                className="yx-card-nav"
                onClick={(e) => { e.stopPropagation(); onDirections?.(service); }}
                title="Yo'l ko'rsatish"
                aria-label="Yo'l ko'rsatish"
              >
                <Navigation style={{ width: '16px', height: '16px' }} />
              </button>
              <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{t.details}</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
