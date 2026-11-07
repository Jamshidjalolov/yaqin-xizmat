import React from 'react';
import { Search, MapPin, ShieldCheck, Zap, Users } from 'lucide-react';
import IconChip from './IconChip';
import { Language, translations } from '../i18n';

interface HeroProps {
  lang: Language;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const Hero: React.FC<HeroProps> = ({ lang, searchQuery, onSearchChange, onSearchSubmit }) => {
  const t = translations[lang];

  return (
    <div style={{ textAlign: 'center', padding: '50px 20px 30px 20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '9999px', color: '#10b981', fontSize: '0.85rem', fontWeight: 600, marginBottom: '20px' }}>
        <Zap style={{ width: '16px', height: '16px' }} />
        <span>{t.heroTag}</span>
      </div>

      <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: '16px' }}>
        {t.heroTitle}
      </h1>

      <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '650px', margin: '0 auto 28px auto' }}>
        {t.heroDesc}
      </p>

      {/* Search Input Box */}
      <form onSubmit={onSearchSubmit} style={{ display: 'flex', gap: '10px', background: 'rgba(30, 41, 59, 0.8)', padding: '8px 12px 8px 20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)', maxWidth: '680px', margin: '0 auto 32px auto', alignItems: 'center' }}>
        <Search style={{ width: '22px', height: '22px', color: '#94a3b8', flexShrink: 0 }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          style={{ flex: 1, background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1rem', outline: 'none' }}
        />
        <button type="submit" className="btn-primary" style={{ padding: '12px 22px', borderRadius: '12px' }}>
          {t.searchBtn}
        </button>
      </form>

      {/* Features highlight */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', flexWrap: 'wrap', color: '#cbd5e1', fontSize: '0.88rem' }}>
        <div className="yx-hero-feature">
          <IconChip size="sm" tone="emerald" icon={<ShieldCheck style={{ width: 14, height: 14 }} />} />
          <span>{t.feature1}</span>
        </div>
        <div className="yx-hero-feature">
          <IconChip size="sm" tone="sky" icon={<MapPin style={{ width: 14, height: 14 }} />} />
          <span>{t.feature2}</span>
        </div>
        <div className="yx-hero-feature">
          <IconChip size="sm" tone="violet" icon={<Users style={{ width: 14, height: 14 }} />} />
          <span>{t.feature3}</span>
        </div>
      </div>
    </div>
  );
};
