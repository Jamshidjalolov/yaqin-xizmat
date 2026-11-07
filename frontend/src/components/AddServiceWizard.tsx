import React, { useState, useRef } from 'react';
import {
  Check, ChevronRight, Phone, Clock, Camera, X, MapPin,
  Search, Navigation, ArrowRight
} from 'lucide-react';
import { createServiceApi, ServiceCreateData, uploadImageApi } from '../api';
import { toast } from 'react-toastify';

interface AddServiceWizardProps {
  authUserData: { displayName: string; photoURL: string; email: string };
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  { id: 'Dorixona', emoji: '💊', label: 'Dorixona' },
  { id: "Go'zallik", emoji: '💄', label: "Go'zallik" },
  { id: 'Tibbiyot', emoji: '🏥', label: 'Tibbiyot' },
  { id: "Ta'lim", emoji: '📚', label: "Ta'lim" },
  { id: 'Santexnika', emoji: '🔧', label: 'Santexnika' },
  { id: 'Elektrik', emoji: '⚡', label: 'Elektrik' },
  { id: 'Tozalash', emoji: '🧹', label: 'Tozalash' },
  { id: 'Avto', emoji: '🚗', label: 'Avto' },
];

const DAYS_OPTIONS = ['Har kuni', 'Dushanba-Juma', 'Dushanba-Shanba', 'Hafta oxirida'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export const AddServiceWizard: React.FC<AddServiceWizardProps> = ({
  authUserData,
  onSuccess,
  onCancel,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [category, setCategory] = useState('Dorixona');
  const [title, setTitle] = useState(authUserData.displayName ? `${authUserData.displayName} xizmati` : 'Shifo Farm');
  const [description, setDescription] = useState('Sifatli dori-darmonlar va sog\'lom hayot uchun ishonchli tanlov.');
  const [phone, setPhone] = useState('+998 90 123 45 67');
  const [days, setDays] = useState('Har kuni');
  const [timeFrom, setTimeFrom] = useState('08:00');
  const [timeTo, setTimeTo] = useState('22:00');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80'
  ]);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 2 fields
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('Buxoro shahri, M. Iqbol ko\'chasi, 12-uy');
  const [lat, setLat] = useState('39.7747');
  const [lng, setLng] = useState('64.4286');
  const [locationSearch, setLocationSearch] = useState('');
  const [locating, setLocating] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files).slice(0, 5 - images.length)) {
      try {
        const url = await uploadImageApi(file);
        setImages(prev => [...prev, url]);
        toast.success('Rasm yuklandi');
      } catch (err) {
        console.warn('Rasmni yuklab bo\'lmadi:', err);
        toast.error('Rasmni yukishda xatolik. Fayl 5MB dan katta bo\'lmasligi va rasm formatida bo\'lishi kerak.');
      }
    }
  };

  const handleGetLocation = () => {
    setLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLng(pos.coords.longitude.toFixed(4));
          setLocating(false);
        },
        () => {
          setLocating(false);
        }
      );
    } else {
      setLocating(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const serviceData: ServiceCreateData = {
        title: title.trim() || 'Xizmat',
        category,
        description,
        price: 0,
        location: address,
        phone,
        provider_name: authUserData.displayName || title,
        image_url: images[0] || undefined,
        gallery: images.length > 1 ? JSON.stringify(images) : undefined,
        days,
        time_from: timeFrom,
        time_to: timeTo,
        lat,
        lng,
        owner_email: authUserData.email
      };
      await createServiceApi(serviceData);
      setSaveSuccess(true);
      toast.success('Xizmat yuborildi! Admin tasdigidan so\'ng e\'lon qilinadi.');
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err) {
      console.error('Submit service error:', err);
      toast.error('Xizmatni saqlashda xatolik yuz berdi.');
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Ma'lumotlar" },
    { num: 2, label: 'Lokatsiya' },
    { num: 3, label: 'Tasdiqlash' },
  ];

  const StepperHeader = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '28px', maxWidth: '600px' }}>
      {steps.map((s, i) => (
        <React.Fragment key={s.num}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: step > s.num ? '#047857' : step === s.num ? '#047857' : '#e2e8f0',
              color: step >= s.num ? '#fff' : '#94a3b8',
              fontWeight: 800, fontSize: '0.9rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: step === s.num ? '3px solid #a7f3d0' : 'none',
              transition: 'all 0.2s'
            }}>
              {step > s.num ? <Check style={{ width: '18px', height: '18px' }} /> : s.num}
            </div>
            <span style={{
              fontSize: '0.78rem', fontWeight: step === s.num ? 700 : 500,
              color: step >= s.num ? '#047857' : '#94a3b8'
            }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: '2px', margin: '0 6px', marginBottom: '20px',
              background: step > s.num ? '#047857' : '#e2e8f0',
              transition: 'all 0.3s'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // ── STEP 1 ────────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f1f5f9' }}>
        <StepperHeader />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Yangi xizmat qo'shish
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px' }}>
          Mijozlar sizni oson topishsin
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Category */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', marginBottom: '14px' }}>
                Kategoriya
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                      padding: '12px 16px', borderRadius: '12px', border: 'none',
                      background: category === cat.id ? '#ecfdf5' : '#f8fafc',
                      cursor: 'pointer', minWidth: '80px',
                      outline: category === cat.id ? '2px solid #047857' : '1.5px solid #e2e8f0',
                      transition: 'all 0.15s'
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>{cat.emoji}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: category === cat.id ? '#047857' : '#64748b' }}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px' }}>
                Tashkilot nomi *
              </label>
              <input
                type="text"
                placeholder="Masalan: Shifo Farm"
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #cbd5e1', borderRadius: '12px',
                  fontSize: '0.95rem', outline: 'none', color: '#0f172a',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                  Xizmat tavsifi *
                </label>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{description.length}/200</span>
              </div>
              <textarea
                placeholder="Xizmatlaringizni qisqacha tasvirlab bering..."
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 200))}
                rows={3}
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '1.5px solid #cbd5e1', borderRadius: '12px',
                  fontSize: '0.9rem', outline: 'none', resize: 'none',
                  color: '#0f172a', lineHeight: 1.5, boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Phone */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#334155', fontSize: '0.9rem', marginBottom: '8px' }}>
                Telefon raqami *
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone style={{ position: 'absolute', left: '14px', width: '18px', height: '18px', color: '#94a3b8' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px 12px 44px',
                    border: '1.5px solid #cbd5e1', borderRadius: '12px',
                    fontSize: '0.95rem', outline: 'none', color: '#0f172a', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Ish vaqti */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Clock style={{ width: '18px', height: '18px', color: '#047857' }} />
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Ish vaqti</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={days}
                  onChange={e => setDays(e.target.value)}
                  style={{
                    flex: 1, padding: '10px 12px', border: '1.5px solid #e2e8f0',
                    borderRadius: '10px', fontSize: '0.88rem', outline: 'none',
                    background: '#f8fafc', color: '#0f172a'
                  }}
                >
                  {DAYS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={{ padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '0.88rem', background: '#f8fafc' }}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>—</span>
                <select value={timeTo} onChange={e => setTimeTo(e.target.value)} style={{ padding: '10px', border: '1.5px solid #e2e8f0', borderRadius: '10px', outline: 'none', fontSize: '0.88rem', background: '#f8fafc' }}>
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Rasmlarni yuklash</span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>5 tagacha rasm</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: '80px', height: '80px', border: '2px dashed #cbd5e1',
                    borderRadius: '10px', background: '#f8fafc',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: '4px', cursor: 'pointer', color: '#94a3b8'
                  }}
                >
                  <Camera style={{ width: '20px', height: '20px' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Rasm qo'shish</span>
                </button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageAdd} style={{ display: 'none' }} />
                {images.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px' }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: '#ef4444', border: 'none', borderRadius: '50%',
                        width: '20px', height: '20px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      <X style={{ width: '12px', height: '12px', color: '#fff' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px', fontWeight: 600 }}>
                Ko'rinish (oldindan ko'rish)
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden',
                  background: '#e2e8f0', flexShrink: 0
                }}>
                  {images[0] ? (
                    <img src={images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                      {CATEGORIES.find(c => c.id === category)?.emoji}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                    {title || 'Tashkilot nomi'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {description.slice(0, 45) || 'Xizmat tavsifi...'}
                  </div>
                  <div style={{
                    display: 'inline-block', background: '#ecfdf5', color: '#047857',
                    fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                    borderRadius: '20px', marginTop: '4px'
                  }}>
                    {category}
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  flex: 1, padding: '14px', border: '1.5px solid #e2e8f0',
                  borderRadius: '12px', background: '#fff', color: '#64748b',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
                }}
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!title.trim()}
                style={{
                  flex: 2, padding: '14px', border: 'none',
                  borderRadius: '12px',
                  background: title.trim() ? '#047857' : '#cbd5e1',
                  color: '#fff', fontWeight: 700, cursor: title.trim() ? 'pointer' : 'default',
                  fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                Keyingi bosqich <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 2: Lokatsiya ─────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f1f5f9' }}>
        <StepperHeader />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          Lokatsiyani belgilang
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px' }}>
          Mijozlar sizni oson topishsin
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>
          {/* Map */}
          <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            {/* Search bar on map */}
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '10px 16px' }}>
                <Search style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
                <input
                  placeholder="Buxoro shahri bo'yicha qidiring..."
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.9rem', flex: 1, color: '#334155' }}
                />
              </div>
              <button
                type="button"
                onClick={handleGetLocation}
                style={{
                  background: '#047857', border: 'none', borderRadius: '12px',
                  width: '44px', height: '44px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title="Mening joylashuvim"
              >
                <Navigation style={{ width: '18px', height: '18px', color: '#fff' }} />
              </button>
            </div>
            {/* OpenStreetMap Buxoro */}
            <div style={{ height: '380px', position: 'relative' }}>
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=64.3586%2C39.7347%2C64.5086%2C39.8147&layer=mapnik&marker=${lat}%2C${lng}`}
                style={{ border: 0, width: '100%', height: '100%' }}
                title="Buxoro xarita"
              />
              {locating && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', color: '#047857', fontWeight: 700
                }}>
                  📍 Joylashuv aniqlanmoqda...
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Selected location card */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: '0.82rem', marginBottom: '12px' }}>
                TANLANGAN JOY
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '10px',
                  background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{CATEGORIES.find(c => c.id === category)?.emoji}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                    {title || 'Tashkilot nomi'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>
                    <MapPin style={{ width: '12px', height: '12px' }} />
                    {address}
                  </div>
                </div>
              </div>
            </div>

            {/* Address form */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Manzil ma'lumotlari</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Manzil nomi
                  </label>
                  <input
                    value={locationName || title}
                    onChange={e => setLocationName(e.target.value)}
                    placeholder="Masalan: Shifo Farm"
                    style={{
                      width: '100%', padding: '10px 14px',
                      border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    To'liq manzil
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <MapPin style={{ position: 'absolute', left: '12px', width: '16px', height: '16px', color: '#94a3b8' }} />
                    <input
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px 10px 36px',
                        border: '1.5px solid #e2e8f0', borderRadius: '10px',
                        fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Geolocation */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Geolokatsiya</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Koordinatalar</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Kenglik (Lat)
                  </label>
                  <input
                    value={lat} onChange={e => setLat(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Uzunlik (Lng)
                  </label>
                  <input
                    value={lng} onChange={e => setLng(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <button
              type="button"
              onClick={() => setStep(3)}
              style={{
                width: '100%', padding: '16px', border: 'none', borderRadius: '12px',
                background: '#047857', color: '#fff', fontWeight: 700, fontSize: '1rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 16px rgba(4,120,87,0.3)'
              }}
            >
              Manzilni tasdiqlash <ArrowRight style={{ width: '20px', height: '20px' }} />
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%', padding: '12px', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', background: '#fff', color: '#64748b',
                fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem'
              }}
            >
              ← Orqaga
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── STEP 3: Tasdiqlash ────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', background: '#f1f5f9' }}>
      <StepperHeader />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
        Ma'lumotlarni tekshiring
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: '24px' }}>
        Hammasi to'g'rimi? E'loningizni backendga saqlang va chop eting!
      </p>

      {saveSuccess ? (
        <div style={{
          background: '#ecfdf5', border: '2px solid #a7f3d0', borderRadius: '20px',
          padding: '40px', textAlign: 'center', maxWidth: '540px'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: '#047857',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#fff'
          }}>
            <Check style={{ width: '36px', height: '36px' }} />
          </div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#064e3b', marginBottom: '8px' }}>
            Xizmat muvaffaqiyatli saqlandi!
          </h3>
          <p style={{ color: '#047857', fontSize: '0.95rem' }}>
            E'loningiz Neon PostgreSQL bazasiga yozildi va barcha mijozlarga ko'rinadi.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            {/* Banner */}
            {images[0] ? (
              <img src={images[0]} alt="banner" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
            ) : (
              <div style={{ height: '120px', background: 'linear-gradient(135deg, #047857, #065f46)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                {CATEGORIES.find(c => c.id === category)?.emoji}
              </div>
            )}

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[1,2,3,4,5].map(s => <span key={s} style={{ color: '#f59e0b' }}>★</span>)}
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '4px' }}>Yangi e'lon</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{title}</div>
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600, marginBottom: '8px' }}>{category} • {address}</div>
              <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>{description}</div>
              <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
                <span>📞 {phone}</span>
                <span>⏰ {days}: {timeFrom}–{timeTo}</span>
                <span>📍 ({lat}, {lng})</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{
                flex: 1, padding: '14px', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', background: '#fff', color: '#64748b',
                fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem'
              }}
            >
              ← Orqaga
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex: 2, padding: '14px', border: 'none',
                borderRadius: '12px', background: '#047857',
                color: '#fff', fontWeight: 700, cursor: 'pointer',
                fontSize: '0.95rem', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 16px rgba(4,120,87,0.3)',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? '⏳ Neon bazaga saqlanmoqda...' : '✅ E\'lonni chop etish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
