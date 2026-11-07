import React, { useState } from 'react';
import { ArrowLeft, ChevronRight, Lock, Mail, AlertCircle, UserPlus } from 'lucide-react';
import { Language, translations } from '../i18n';
import { signInWithGoogle } from '../firebase';
import { loginUserStrict, registerUserStrict, fetchUserProfileApi } from '../api';
import { toast } from 'react-toastify';

interface AuthMethodScreenProps {
  lang: Language;
  role: 'customer' | 'provider';
  onBack: () => void;
  onGoogleAuth: (googleUserData: { email: string; displayName: string; photoURL: string; phone?: string }) => void;
  onPhoneSubmit: (phone: string) => void;
  onEmailLoginSuccess: (email: string, displayName: string, role: 'customer' | 'provider') => void;
}

export const AuthMethodScreen: React.FC<AuthMethodScreenProps> = ({
  lang,
  role,
  onBack,
  onGoogleAuth,
  onPhoneSubmit,
  onEmailLoginSuccess,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email/parol bo'limi
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [needRegister, setNeedRegister] = useState(false);
  const t = translations[lang];

  const handleGoogleClick = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const googleUser = await signInWithGoogle();
      onGoogleAuth({
        email: googleUser.email,
        displayName: googleUser.displayName,
        photoURL: googleUser.photoURL,
        phone: phoneNumber ? `+998 ${phoneNumber}` : ''
      });
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Google orqali kirishda xatolik yuz berdi. Qayta urinib ko'ring.";
      setAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    onPhoneSubmit(`+998 ${phoneNumber}`);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setNeedRegister(false);
    if (!email.trim()) { setEmailError('Email kiriting.'); return; }
    if (!password) { setEmailError('Parol kiriting.'); return; }

    setEmailBusy(true);
    try {
      if (authMode === 'login') {
        const data = await loginUserStrict(email.trim(), password);
        const profile = data?.user || await fetchUserProfileApi(email.trim());
        const realRole: 'customer' | 'provider' = profile?.role === 'provider' ? 'provider' : 'customer';
        toast.success(`Xush kelibsiz${profile?.full_name ? `, ${profile.full_name}` : ''}!`);
        if (role === 'provider' && realRole === 'customer') {
          toast.info('Ustalik rolini sayt administratori faollashtiradi. Hozircha mijoz sifatida kirdingiz.');
        }
        onEmailLoginSuccess(email.trim(), profile?.full_name || '', realRole);
      } else {
        if (!fullName.trim()) { setEmailError('Ismingizni kiriting.'); setEmailBusy(false); return; }
        await registerUserStrict(email.trim(), password, fullName.trim(), phoneNumber || undefined, 'customer');
        const data = await loginUserStrict(email.trim(), password);
        const profile = data?.user;
        toast.success('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!');
        if (role === 'provider') {
          toast.info('Ustalik rolini sayt administratori tasdiqlagandan so\'ng faollashtiriladi.');
        }
        onEmailLoginSuccess(email.trim(), profile?.full_name || fullName.trim(), 'customer');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail;
      if (status === 404) {
        setNeedRegister(true);
        setEmailError(detail || "Bu email ro'yxatdan o'tmagan. Avval ro'yxatdan o'ting.");
        setAuthMode('register');
      } else if (status === 401) {
        setEmailError(detail || 'Email yoki parol noto\'g\'ri.');
      } else if (status === 403) {
        setEmailError(detail || 'Hisob bloklangan.');
      } else {
        setEmailError(detail || 'Serverga ulanishda xatolik. Qayta urinib ko\'ring.');
      }
    } finally {
      setEmailBusy(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: '1.5px solid #cbd5e1',
    borderRadius: '14px',
    padding: '13px 16px',
    fontSize: '0.98rem',
    color: '#0f172a',
    outline: 'none',
    background: '#ffffff',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 20px 40px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Bar */}
      <div style={{ width: '100%', maxWidth: '440px', display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#1e293b' }}
        >
          <ArrowLeft style={{ width: '24px', height: '24px' }} />
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ width: '100%', maxWidth: '440px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Hisobga kirish
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.45, marginBottom: '24px' }}>
          Email va parol orqali kiring, yoki Google / telefon raqamingizdan foydalaning.
        </p>

        {/* ── EMAIL / PAROL ── */}
        <div style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px',
          padding: '20px', marginBottom: '16px'
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '12px', padding: '4px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setEmailError(null); setNeedRegister(false); }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '9px', cursor: 'pointer',
                background: authMode === 'login' ? '#ffffff' : 'transparent',
                color: authMode === 'login' ? '#047857' : '#64748b',
                fontWeight: 700, fontSize: '0.9rem', boxShadow: authMode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setEmailError(null); setNeedRegister(false); }}
              style={{
                flex: 1, padding: '9px', border: 'none', borderRadius: '9px', cursor: 'pointer',
                background: authMode === 'register' ? '#ffffff' : 'transparent',
                color: authMode === 'register' ? '#047857' : '#64748b',
                fontWeight: 700, fontSize: '0.9rem', boxShadow: authMode === 'register' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              Ro'yxatdan o'tish
            </button>
          </div>

          <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {authMode === 'register' && (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="To'liq ismingiz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '44px' }}
                />
                <UserPlus style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="Email manzilingiz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '44px' }}
              />
              <Mail style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '44px' }}
              />
              <Lock style={{ width: '18px', height: '18px', color: '#94a3b8', position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            {emailError && (
              <div style={{
                background: needRegister ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${needRegister ? '#fde68a' : '#fecaca'}`,
                borderRadius: '12px', padding: '11px 14px', fontSize: '0.86rem',
                color: needRegister ? '#b45309' : '#dc2626', lineHeight: 1.45,
                display: 'flex', gap: '8px', alignItems: 'flex-start'
              }}>
                <AlertCircle style={{ width: '17px', height: '17px', flexShrink: 0, marginTop: '1px' }} />
                <span>{emailError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={emailBusy}
              style={{
                width: '100%', background: '#047857', color: '#ffffff', border: 'none',
                borderRadius: '30px', padding: '14px', fontSize: '1rem', fontWeight: 700,
                cursor: emailBusy ? 'not-allowed' : 'pointer', opacity: emailBusy ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 8px 20px rgba(4, 120, 87, 0.25)'
              }}
            >
              <span>{emailBusy ? 'Yuklanmoqda...' : (authMode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish")}</span>
              {!emailBusy && <ChevronRight style={{ width: '18px', height: '18px' }} />}
            </button>
          </form>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>yoki</span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          style={{
            width: '100%', background: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '18px',
            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            opacity: loading ? 0.7 : 1, marginBottom: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.29v3.15C3.26 21.3 7.35 24 12 24z"/>
              <path fill="#FBBC05" d="M5.31 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.29C.47 8.21 0 10.05 0 12s.47 3.79 1.29 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.7 1.29 6.58l4.02 3.15c.94-2.83 3.58-4.98 6.69-4.98z"/>
            </svg>
            <div style={{ textAlign: 'left' }}>
              <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                {loading ? "Ulanmoqda..." : "Google orqali kirish"}
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                {loading ? "Iltimos kuting..." : "Hisobingiz ma'lumotlari avtomatik olinadi"}
              </span>
            </div>
          </div>
          <ChevronRight style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
        </button>

        {authError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px',
            padding: '12px 16px', fontSize: '0.88rem', color: '#dc2626', lineHeight: 1.5, marginBottom: '12px'
          }}>
            ⚠️ {authError}
          </div>
        )}

        {/* Phone Input Box */}
        <form onSubmit={handlePhoneSubmitForm}>
          <div style={{
            display: 'flex', alignItems: 'center', border: '1.5px solid #cbd5e1',
            borderRadius: '16px', overflow: 'hidden', marginBottom: '14px', background: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '13px 15px',
              borderRight: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem',
              fontWeight: 700, color: '#0f172a'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🇺🇿</span>
              <span>+998</span>
            </div>
            <input
              type="tel"
              placeholder="90 123 45 67"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', padding: '13px 15px', fontSize: '1.05rem', fontWeight: 600, color: '#0f172a' }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%', background: '#ffffff', color: '#047857', border: '2px solid #a7f3d0',
              borderRadius: '30px', padding: '13px', fontSize: '1rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer'
            }}
          >
            <span>Telefon orqali davom etish</span>
            <ChevronRight style={{ width: '18px', height: '18px' }} />
          </button>
        </form>

        {/* Security Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '24px', color: '#64748b', fontSize: '0.85rem' }}>
          <Lock style={{ width: '16px', height: '16px', color: '#047857' }} />
          <span>Ma'lumotlaringiz xavfsiz va maxfiy saqlanadi.</span>
        </div>
      </div>
    </div>
  );
};
