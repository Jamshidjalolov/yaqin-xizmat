import React from 'react';
import { Heart, User, Store, CheckCircle, ArrowRight } from 'lucide-react';
import { Language } from '../i18n';

interface SuccessCompleteScreenProps {
  lang: Language;
  onStart: () => void;
}

export const SuccessCompleteScreen: React.FC<SuccessCompleteScreenProps> = ({ onStart }) => {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 20px 28px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Bar Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#064e3b' }}>
          Yaqin<span style={{ color: '#047857' }}>Xizmat</span>
        </span>
      </div>

      {/* Hero Celebration Banner */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '440px',
        height: '180px',
        borderRadius: '24px',
        overflow: 'hidden',
        backgroundImage: 'url("/welcome_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 10px 25px rgba(4, 120, 87, 0.15)'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(4, 120, 87, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '80px',
          height: '80px',
          background: '#047857',
          borderRadius: '50% 50% 50% 0',
          transform: 'rotate(-45deg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <div style={{ transform: 'rotate(45deg)' }}>
            <Heart style={{ width: '38px', height: '38px', fill: '#facc15', color: '#facc15' }} />
          </div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
          Hisobingiz tayyor!
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', fontWeight: 500 }}>
          YaqinXizmat'dan foydalanishni boshlang
        </p>
      </div>

      {/* Feature Cards Summary */}
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
        {/* Card 1: Mijozlar uchun */}
        <div style={{
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          background: '#ffffff'
        }}>
          <div style={{ width: '42px', height: '42px', background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#047857', flexShrink: 0 }}>
            <User style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Mijozlar uchun
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Yaqin atrofdagi xizmatlarni qidiringsiz</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Ishonchli mutaxassislarni tanlang</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Xizmatlarga baho bering</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Xizmat ko'rsatuvchilar uchun */}
        <div style={{
          border: '1.5px solid #e2e8f0',
          borderRadius: '20px',
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          background: '#ffffff'
        }}>
          <div style={{ width: '42px', height: '42px', background: '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', flexShrink: 0 }}>
            <Store style={{ width: '22px', height: '22px' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Xizmat ko'rsatuvchilar uchun
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Xizmatlaringizni bepul e'lon qiling</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Yangi mijozlarga erishing</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
                <span>Biznesingizni rivojlantiring</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <button
          onClick={onStart}
          style={{
            width: '100%',
            background: '#047857',
            color: '#ffffff',
            border: 'none',
            borderRadius: '30px',
            padding: '16px',
            fontSize: '1.05rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px rgba(4, 120, 87, 0.35)'
          }}
        >
          <span>Boshlash</span>
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      </div>

      {/* Footer Slogan */}
      <div style={{ textAlign: 'center', paddingTop: '16px', fontSize: '0.8rem', color: '#94a3b8' }}>
        Yaqin xizmatlar — yanada yaxshi hayot!
      </div>
    </div>
  );
};
