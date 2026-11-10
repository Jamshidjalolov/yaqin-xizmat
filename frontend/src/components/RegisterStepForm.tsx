import React, { useState } from 'react';
import { ArrowLeft, Camera, User, Phone, MapPin, Briefcase, Building2, Store, ChevronRight, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { Language } from '../i18n';

interface RegisterStepFormProps {
  lang: Language;
  role: 'customer' | 'provider';
  initialData?: { email?: string; displayName?: string; photoURL?: string; phone?: string };
  onBack: () => void;
  onSubmitProfile: (profileData: {
    fullName: string;
    phone: string;
    city?: string;
    activityType?: string;
    businessName?: string;
    avatarUrl?: string;
  }) => Promise<void>;
}

export const RegisterStepForm: React.FC<RegisterStepFormProps> = ({
  role,
  initialData,
  onBack,
  onSubmitProfile,
}) => {
  const [fullName, setFullName] = useState(initialData?.displayName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [city, setCity] = useState('Buxoro');
  const [activityType, setActivityType] = useState('Santexnika');
  const [businessName, setBusinessName] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'customer' && !termsAgreed) {
      toast.info('Davom etish uchun foydalanish shartlariga rozilik bering.');
      return;
    }
    setLoading(true);
    try {
      await onSubmitProfile({
        fullName,
        phone,
        city,
        activityType,
        businessName,
        avatarUrl: initialData?.photoURL || ''
      });
    } catch (err: any) {
      console.error(err);
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Profilni saqlashda xatolik. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  const isCustomer = role === 'customer';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px 20px 32px 20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: '#1e293b' }}
        >
          <ArrowLeft style={{ width: '24px', height: '24px' }} />
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#064e3b' }}>
            Yaqin<span style={{ color: '#047857' }}>Xizmat</span>
          </span>
          <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b' }}>
            Yaxshi xizmat — yaqinroq hayot!
          </span>
        </div>

        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857' }}>1/3</span>
      </div>

      {/* Stepper Bar */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '16px', left: '15%', right: '15%', height: '2px', background: '#e2e8f0', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '32px', height: '32px', background: '#047857', borderRadius: '50%', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>1</div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857' }}>Ro'yxatdan o'tish</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>2</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tasdiqlash</span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ width: '32px', height: '32px', background: '#e2e8f0', borderRadius: '50%', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>3</div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Tayyor</span>
        </div>
      </div>

      {/* Main Form Content */}
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          {isCustomer ? "Mijoz sifatida ro'yxatdan o'tish" : "Xizmat ko'rsatuvchi"}
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.45, marginBottom: '24px' }}>
          {isCustomer
            ? "Yaqin atrofingizdagi ishonchli xizmatlardan oson foydalaning."
            : "Biznesingizni YaqinXizmat'da ommaga taniting va yangi mijozlarga erishing."
          }
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Profile Photo Upload (if Customer) */}
          {/* Profile photo - show Google photo if available */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: initialData?.photoURL ? 'transparent' : '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              overflow: 'hidden',
              border: initialData?.photoURL ? '3px solid #047857' : '2px dashed #cbd5e1',
              boxShadow: initialData?.photoURL ? '0 4px 12px rgba(4,120,87,0.2)' : 'none'
            }}>
              {initialData?.photoURL ? (
                <img src={initialData.photoURL} alt="Google profil rasmi" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera style={{ width: '28px', height: '28px' }} />
              )}
            </div>
            <div>
              <span style={{ fontSize: '0.9rem', color: initialData?.photoURL ? '#047857' : '#64748b', fontWeight: 600, display: 'block' }}>
                {initialData?.photoURL ? '✓ Google rasmi ulandi' : 'Profil rasmini qo\'shish'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                {initialData?.photoURL ? 'Google hisobingizdan olingan' : '(ixtiyoriy)'}
              </span>
            </div>
          </div>

          {/* Input 1: Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              {isCustomer ? "To'liq ism *" : "Mas'ul shaxs *"}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <User style={{ position: 'absolute', left: '16px', width: '20px', height: '20px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                placeholder="Ism familiyangiz"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* Input 2: Phone Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Telefon raqami *
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Phone style={{ position: 'absolute', left: '16px', width: '20px', height: '20px', color: '#94a3b8' }} />
              <input
                type="text"
                required
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 48px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  outline: 'none',
                  color: '#0f172a'
                }}
              />
            </div>
          </div>

          {/* Customer Specific Field: City */}
          {isCustomer && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Shahar *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MapPin style={{ position: 'absolute', left: '16px', width: '20px', height: '20px', color: '#94a3b8' }} />
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '16px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    outline: 'none',
                    color: '#0f172a',
                    background: '#ffffff',
                    appearance: 'none'
                  }}
                >
                  <option value="Buxoro">Buxoro</option>
                  <option value="Toshkent">Toshkent sh.</option>
                  <option value="Samarqand">Samarqand</option>
                  <option value="Andijon">Andijon</option>
                  <option value="Farg'ona">Farg'ona</option>
                  <option value="Namangan">Namangan</option>
                </select>
              </div>
            </div>
          )}

          {/* Provider Specific Fields: Activity Type & Business Name */}
          {!isCustomer && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Faoliyat turi *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Briefcase style={{ position: 'absolute', left: '16px', width: '20px', height: '20px', color: '#94a3b8' }} />
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      outline: 'none',
                      color: '#0f172a',
                      background: '#ffffff',
                      appearance: 'none'
                    }}
                  >
                    <option value="Santexnika">Santexnika</option>
                    <option value="Elektrik">Elektrik</option>
                    <option value="Tozalash">Tozalash xizmati</option>
                    <option value="Ta'lim">Ta'lim / Repetitor</option>
                    <option value="Avto">Avto usta</option>
                    <option value="Maishiy Texnika">Maishiy texnika ta'mirlash</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Tashkilot nomi *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Building2 style={{ position: 'absolute', left: '16px', width: '20px', height: '20px', color: '#94a3b8' }} />
                  <input
                    type="text"
                    required
                    placeholder="Tashkilot nomi / brend"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '16px',
                      fontSize: '1rem',
                      fontWeight: 500,
                      outline: 'none',
                      color: '#0f172a'
                    }}
                  />
                </div>
              </div>

              {/* Provider Info Banner */}
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '16px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ background: '#047857', padding: '8px', borderRadius: '10px', color: '#ffffff' }}>
                  <Store style={{ width: '20px', height: '20px' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#065f46' }}>Sizning xizmatlaringiz</div>
                  <div style={{ fontSize: '0.8rem', color: '#047857' }}>minglab mijozlarga yanada yaqin bo'ladi!</div>
                </div>
              </div>
            </>
          )}

          {/* Terms Checkbox for Customer */}
          {isCustomer && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: '6px 0' }}>
              <div style={{
                width: '22px',
                height: '22px',
                borderRadius: '6px',
                background: termsAgreed ? '#047857' : '#ffffff',
                border: termsAgreed ? 'none' : '1.5px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                {termsAgreed && <Check style={{ width: '16px', height: '16px' }} />}
              </div>
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>
                <span style={{ textDecoration: 'underline', color: '#047857', fontWeight: 600 }}>Foydalanish shartlariga</span> roziman
              </span>
            </label>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
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
              boxShadow: '0 8px 20px rgba(4, 120, 87, 0.3)',
              marginTop: '10px'
            }}
          >
            <span>{loading ? "Saqlanmoqda..." : (isCustomer ? "Ro'yxatdan o'tish" : "Davom etish")}</span>
            <ChevronRight style={{ width: '20px', height: '20px' }} />
          </button>
        </form>
      </div>

      {/* Footer Branding */}
      <div style={{ textAlign: 'center', paddingTop: '24px', fontSize: '0.8rem', color: '#94a3b8' }}>
        Buxoro — yaxshi odamlar, yaqin xizmatlar
      </div>
    </div>
  );
};
