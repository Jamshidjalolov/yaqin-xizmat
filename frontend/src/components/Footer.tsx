import React from 'react';
import { Heart } from 'lucide-react';
import { Language, translations } from '../i18n';

interface FooterProps {
  lang: Language;
}

export const Footer: React.FC<FooterProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: '#0b1120', padding: '40px 20px 24px 20px', marginTop: '80px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: '#047857',
              borderRadius: '50% 50% 50% 0',
              transform: 'rotate(-45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ transform: 'rotate(45deg)' }}>
                <Heart style={{ width: '14px', height: '14px', fill: '#facc15', color: '#facc15' }} />
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
              Yaqin<span style={{ color: '#10b981' }}>Xizmat</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', color: '#94a3b8', fontSize: '0.9rem' }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{t.slogan}</a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.85rem', color: '#64748b' }}>
          <span>© {new Date().getFullYear()} YaqinXizmat platformasi. Barcha huquqlar himoyalangan.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {t.footerSpirit}
          </span>
        </div>
      </div>
    </footer>
  );
};
