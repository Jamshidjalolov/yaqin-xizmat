import React, { useState } from 'react';
import { ChevronDown, Zap, MapPin, Users, ArrowRight, Heart, ShieldCheck } from 'lucide-react';
import { Language, translations } from '../i18n';

interface WelcomeScreenProps {
  lang: Language;
  onLangChange: (lang: Language) => void;
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  lang,
  onLangChange,
  onLoginClick,
  onRegisterClick,
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const t = translations[lang];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0f172a',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Background Architectural Banner */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url("/welcome_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        opacity: 0.45,
        filter: 'brightness(0.95)',
        zIndex: 0
      }} />

      {/* Overlay Ambient Gradients */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 70% 30%, rgba(4, 120, 87, 0.25) 0%, transparent 60%), linear-gradient(to top, #0f172a 0%, rgba(15, 23, 42, 0.7) 50%, rgba(15, 23, 42, 0.4) 100%)',
        zIndex: 1
      }} />

      {/* Top Header Bar */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            background: '#047857',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 20px rgba(4, 120, 87, 0.4)'
          }}>
            <div style={{ transform: 'rotate(45deg)' }}>
              <Heart style={{ width: '20px', height: '20px', fill: '#facc15', color: '#facc15' }} />
            </div>
          </div>
          <div>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              Yaqin<span style={{ color: '#10b981' }}>Xizmat</span>
            </span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>
              {t.tagline}
            </span>
          </div>
        </div>

        {/* Language Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.95rem',
              fontWeight: 700,
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{lang}</span>
            <ChevronDown style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          </button>

          {langMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              right: 0,
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '14px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              overflow: 'hidden',
              zIndex: 30,
              minWidth: '100px'
            }}>
              {(['UZ', 'RU', 'EN'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    onLangChange(l);
                    setLangMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 18px',
                    textAlign: 'left',
                    background: lang === l ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    border: 'none',
                    fontSize: '0.95rem',
                    fontWeight: lang === l ? 700 : 500,
                    color: lang === l ? '#10b981' : '#f8fafc',
                    cursor: 'pointer'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <main style={{
        position: 'relative',
        zIndex: 10,
        flex: 1,
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '40px 32px 60px 32px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>
        {/* Left Column: Widescreen Hero Text & Features */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            color: '#34d399',
            fontSize: '0.9rem',
            fontWeight: 600,
            width: 'fit-content'
          }}>
            <ShieldCheck style={{ width: '18px', height: '18px' }} />
            <span>O'zbekistondagi Ishonchli Ustalar Platformasi</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            margin: 0
          }}>
            {t.heading1}
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#cbd5e1',
            lineHeight: 1.6,
            maxWidth: '560px',
            margin: 0
          }}>
            {t.heroDesc}
          </p>

          {/* Feature Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '10px' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: '#047857', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                <Zap style={{ width: '18px', height: '18px', color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>{t.feature1}</span>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: '#047857', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                <MapPin style={{ width: '18px', height: '18px', color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>{t.feature2}</span>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 20px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ background: '#047857', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center' }}>
                <Users style={{ width: '18px', height: '18px', color: '#ffffff' }} />
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc' }}>{t.feature3}</span>
            </div>
          </div>

          <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', marginTop: '10px' }}>
            {t.footerSpirit}
          </div>
        </div>

        {/* Right Column: Premium Glassmorphic Action Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '28px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(16, 185, 129, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          maxWidth: '480px',
          justifySelf: 'end',
          width: '100%'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                <Heart style={{ width: '18px', height: '18px', color: '#10b981' }} />
              </div>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Xush Kelibsiz!
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Davom etish uchun kirasizmi?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '6px' }}>
              Kerakli mutaxassisni tanlang yoki xizmatlaringizni taklif qiling.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
            <button
              onClick={onLoginClick}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                justifyContent: 'center',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)'
              }}
            >
              <span>{t.login}</span>
              <ArrowRight style={{ width: '20px', height: '20px' }} />
            </button>

            <button
              onClick={onRegisterClick}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '16px',
                fontSize: '1.1rem',
                justifyContent: 'center'
              }}
            >
              {t.register}
            </button>
          </div>

          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: '#64748b'
          }}>
            Barcha xizmatlar kafolatlangan va tasdiqlangan mutaxassislar tomonidan ko'rsatiladi.
          </div>
        </div>
      </main>
    </div>
  );
};
