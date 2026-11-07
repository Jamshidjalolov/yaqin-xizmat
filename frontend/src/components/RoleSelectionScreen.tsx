import React from 'react';
import { ArrowLeft, ChevronRight, Heart, CheckCircle2 } from 'lucide-react';
import { Language, translations } from '../i18n';

interface RoleSelectionScreenProps {
  lang: Language;
  onBack: () => void;
  onSkip: () => void;
  onSelectRole: (role: 'customer' | 'provider' | 'admin') => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({
  lang,
  onBack,
  onSkip,
  onSelectRole,
}) => {
  const t = translations[lang];

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Header Bar */}
      <header style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <button
          onClick={onBack}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            padding: '10px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#1e293b',
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}
        >
          <ArrowLeft style={{ width: '18px', height: '18px' }} />
          <span>{t.back}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => onSelectRole('admin')}
            style={{
              background: '#0f172a',
              color: '#10b981',
              border: '1px solid #334155',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span>🛡️ Admin Panel</span>
          </button>

          <button
            onClick={onSkip}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: 600,
              color: '#64748b',
              cursor: 'pointer',
              padding: '8px 16px'
            }}
          >
            {t.skip}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '20px 32px 60px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        {/* Title Header */}
        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 48px auto' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.2,
            marginBottom: '12px'
          }}>
            {t.roleTitle}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#64748b',
            fontWeight: 500
          }}>
            {t.roleSubtitle}
          </p>
        </div>

        {/* Responsive Grid for Role Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '28px',
          maxWidth: '1100px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Card 1: Mijoz (Customer) */}
          <div
            onClick={() => onSelectRole('customer')}
            style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              border: '2px solid #a7f3d0',
              borderRadius: '28px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 15px 35px -10px rgba(16, 185, 129, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              minHeight: '340px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = '#10b981';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#a7f3d0';
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '110px', height: '110px', flexShrink: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                <img
                  src="/customer_avatar.png"
                  alt="Mijoz"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginBottom: '8px' }}>
                  {t.customerTitle}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#047857', lineHeight: 1.5, fontWeight: 500 }}>
                  {t.customerDesc}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Ishonchli mutaxassislarni tezda toping</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Haqqoniy baholashlar va mulohazalar</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(4, 120, 87, 0.15)'
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065f46' }}>Mijoz Sifatida Kirish</span>
              <div style={{
                width: '38px',
                height: '38px',
                background: '#047857',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
              }}>
                <ChevronRight style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Xizmat ko'rsatuvchi (Provider) */}
          <div
            onClick={() => onSelectRole('provider')}
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '2px solid #fde68a',
              borderRadius: '28px',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              position: 'relative',
              boxShadow: '0 15px 35px -10px rgba(245, 158, 11, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              minHeight: '340px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = '#f59e0b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#fde68a';
            }}
          >
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div style={{ width: '110px', height: '110px', flexShrink: 0, borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}>
                <img
                  src="/provider_avatar.png"
                  alt="Xizmat ko'rsatuvchi"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#78350f', marginBottom: '8px' }}>
                  {t.providerTitle}
                </h3>
                <p style={{ fontSize: '0.92rem', color: '#92400e', lineHeight: 1.5, fontWeight: 500 }}>
                  {t.providerDesc}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78350f', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#d97706' }} />
                <span>O'z xizmatlaringizni bepul joylashtiring</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#78350f', fontSize: '0.85rem', fontWeight: 600 }}>
                <CheckCircle2 style={{ width: '16px', height: '16px', color: '#d97706' }} />
                <span>Admin tasdig'idan so'ng mijozlar ko'radi</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(120, 53, 15, 0.15)'
            }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#78350f' }}>Usta Sifatida Kirish</span>
              <div style={{
                width: '38px',
                height: '38px',
                background: '#eab308',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)'
              }}>
                <ChevronRight style={{ width: '22px', height: '22px' }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '24px',
            height: '24px',
            background: '#047857',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ transform: 'rotate(45deg)' }}>
              <Heart style={{ width: '12px', height: '12px', fill: '#facc15', color: '#facc15' }} />
            </div>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064e3b' }}>
            Yaqin<span style={{ color: '#047857' }}>Xizmat</span>
          </span>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
          {t.slogan}
        </p>
      </footer>
    </div>
  );
};
