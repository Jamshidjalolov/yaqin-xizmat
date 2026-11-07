import React from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '20px'
    }} onClick={onCancel}>
      <div style={{
        background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '420px',
        padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Warning Icon */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', color: '#ef4444'
        }}>
          <AlertTriangle style={{ width: '32px', height: '32px' }} />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Tizimdan chiqmoqchimisiz?
        </h3>
        <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '28px' }}>
          Hisobingizdan chiqqandan so'ng qayta kirish uchun Google yoki telefon raqamingizdan foydalanishingiz kerak bo'ladi.
        </p>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '14px', border: '1.5px solid #e2e8f0',
              borderRadius: '14px', background: '#f8fafc', color: '#475569',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1.2, padding: '14px', border: 'none',
              borderRadius: '14px', background: '#ef4444', color: '#ffffff',
              fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
              transition: 'all 0.15s'
            }}
          >
            <LogOut style={{ width: '18px', height: '18px' }} />
            <span>Ha, chiqish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
