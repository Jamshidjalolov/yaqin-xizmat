import React, { useState, useEffect } from 'react';
import { User, LogOut, Heart } from 'lucide-react';
import { Language, translations } from '../i18n';
import { ConfirmLogoutModal } from './ConfirmLogoutModal';
import { fetchUserProfileApi } from '../api';

interface NavbarProps {
  lang: Language;
  onLangChange: (lang: Language) => void;
  onOpenAuthModal: () => void;
  userEmail: string | null;
  selectedRole: 'customer' | 'provider' | 'admin' | null;
  onLogout: () => void;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onLangChange,
  onOpenAuthModal,
  userEmail,
  selectedRole,
  onLogout,
  onGoHome,
}) => {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [registeredName, setRegisteredName] = useState<string>('');
  const t = translations[lang];

  useEffect(() => {
    if (userEmail) {
      fetchUserProfileApi(userEmail).then(p => {
        if (p?.full_name) setRegisteredName(p.full_name);
      });
    } else {
      setRegisteredName('');
    }
  }, [userEmail]);

  const displayLabel = registeredName || (userEmail ? userEmail.split('@')[0] : '');
  const initial = (registeredName || userEmail || '?')[0].toUpperCase();

  return (
    <>
      <nav className="glass-nav" style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={onGoHome}>
          <div style={{
            width: '38px',
            height: '38px',
            background: '#047857',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
          }}>
            <div style={{ transform: 'rotate(45deg)' }}>
              <Heart style={{ width: '18px', height: '18px', fill: '#facc15', color: '#facc15' }} />
            </div>
          </div>

          <div>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Yaqin<span style={{ color: '#10b981' }}>Xizmat</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
              • Buxoro xizmatlari portali
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Language selector */}
          <select
            value={lang}
            onChange={(e) => onLangChange(e.target.value as Language)}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              padding: '6px 10px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="UZ">UZ</option>
            <option value="RU">RU</option>
            <option value="EN">EN</option>
          </select>

          {userEmail ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px 12px', borderRadius: '9999px' }}>
              <div style={{ width: '26px', height: '26px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 700, fontSize: '0.75rem' }}>
                {initial}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0' }}>{displayLabel}</span>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                title={t.logout}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuthModal} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User style={{ width: '16px', height: '16px' }} />
              <span>{t.login}</span>
            </button>
          )}
        </div>
      </nav>

      {/* Logout modal */}
      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </>
  );
};
