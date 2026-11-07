import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3, BarChart2, QrCode, Share2, Star, MapPin, Clock,
  Phone, FileText, Camera, ChevronRight, CheckCircle, Heart,
  Users, ExternalLink, X, Check, Copy, Plus, Trash2, Image as ImageIcon,
  MessageSquare, AlertCircle, AlertTriangle, Eye, Navigation
} from 'lucide-react';
import { Service, Review, fetchServices, updateServiceApi, deleteServiceApi, fetchReviewsApi, uploadImageApi } from '../api';
import { osmMarkerLink } from '../utils/route';
import { toast } from 'react-toastify';
import { PageLoader } from './PageLoader';

interface MyServicePageProps {
  authUserData: { displayName: string; photoURL: string; email: string };
  onBack: () => void;
  onAddNewService: () => void;
}

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Dorixona': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=800&q=80',
  'Santexnika': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
  'Elektrik': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  'Go\'zallik': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'Tozalash': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'Ta\'lim': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  'Avto': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
};

export const MyServicePage: React.FC<MyServicePageProps> = ({ authUserData, onBack, onAddNewService }) => {
  const [activeTab, setActiveTab] = useState<'umumiy' | 'galereya' | 'sharhlar'>('umumiy');
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDays, setEditDays] = useState('Har kuni');
  const [editTimeFrom, setEditTimeFrom] = useState('08:00');
  const [editTimeTo, setEditTimeTo] = useState('22:00');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOwnerServices = async () => {
    setLoading(true);
    try {
      // Pass owner_email to fetch ALL own services (including pending/rejected)
      const all = await fetchServices(undefined, undefined, authUserData.email);
      setMyServices(all);
      if (all.length > 0) {
        const current = selectedServiceId ? (all.find(s => s.id === selectedServiceId) || all[0]) : all[0];
        setSelectedServiceId(current.id);
        populateEditForm(current);
      } else {
        setSelectedServiceId(null);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  const populateEditForm = (srv: Service) => {
    setEditTitle(srv.title);
    setEditDesc(srv.description);
    setEditPhone(srv.phone);
    setEditLocation(srv.location);
    setEditDays(srv.days || 'Har kuni');
    setEditTimeFrom(srv.time_from || '08:00');
    setEditTimeTo(srv.time_to || '22:00');
    setEditImageUrl(srv.image_url || CATEGORY_DEFAULT_IMAGES[srv.category] || '');
  };

  useEffect(() => {
    loadOwnerServices();
  }, [authUserData.email]);

  useEffect(() => {
    if (selectedServiceId) {
      fetchReviewsApi(selectedServiceId).then(setReviews);
    } else {
      setReviews([]);
    }
  }, [selectedServiceId]);

  const currentService = myServices.find(s => s.id === selectedServiceId) || (myServices.length > 0 ? myServices[0] : null);

  const avgRating = currentService?.rating_count ? (currentService.rating || 0) : 0;
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));
  const distTotal = reviews.length || 1;

  const handleSelectService = (srv: Service) => {
    setSelectedServiceId(srv.id);
    populateEditForm(srv);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageApi(file);
      setEditImageUrl(url);
      toast.success('Rasm yuklandi');
    } catch (err) {
      console.warn("Rasmni yuklab bo'lmadi:", err);
      toast.error('Rasmni yukishda xatolik yuz berdi.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentService) return;
    setSaving(true);
    try {
      const updated = await updateServiceApi(currentService.id, {
        title: editTitle,
        description: editDesc,
        phone: editPhone,
        location: editLocation,
        days: editDays,
        time_from: editTimeFrom,
        time_to: editTimeTo,
        image_url: editImageUrl
      });
      setMyServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      setIsEditModalOpen(false);
      toast.success('O\'zgarishlar saqlandi');
    } catch (err) {
      console.error(err);
      toast.error('Saqlashda xatolik yuz berdi, lokal ko\'rinish yangilandi.');
      setMyServices(prev => prev.map(s => s.id === currentService.id ? ({
        ...s,
        title: editTitle,
        description: editDesc,
        phone: editPhone,
        location: editLocation,
        days: editDays,
        time_from: editTimeFrom,
        time_to: editTimeTo,
        image_url: editImageUrl
      }) : s));
      setIsEditModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async () => {
    if (!currentService) return;
    if (!window.confirm(`"${currentService.title}" xizmatini o'chirishni tasdiqlaysizmi?`)) return;
    try {
      await deleteServiceApi(currentService.id);
      const remaining = myServices.filter(s => s.id !== currentService.id);
      setMyServices(remaining);
      toast.success('Xizmat o\'chirildi');
      if (remaining.length > 0) {
        setSelectedServiceId(remaining[0].id);
        populateEditForm(remaining[0]);
      } else {
        setSelectedServiceId(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('O\'chirishda xatolik yuz berdi.');
    }
  };

  const handleOpenMap = () => {
    const lat = currentService?.lat || '39.7747';
    const lng = currentService?.lng || '64.4286';
    window.open(osmMarkerLink(lat, lng), '_blank');
  };

  const handleShare = () => {
    const shareUrl = window.location.origin + '/#service-' + (currentService?.id || 1);
    if (navigator.share) {
      navigator.share({
        title: currentService?.title || 'YaqinXizmat',
        text: `${currentService?.title} — Buxorodagi eng yaqin xizmat!`,
        url: shareUrl
      }).catch(() => setIsShareModalOpen(true));
    } else {
      setIsShareModalOpen(true);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = window.location.origin + '/#service-' + (currentService?.id || 1);
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return <PageLoader text="Sizning xizmatlaringiz yuklanmoqda..." />;
  }

  // ── IF PROVIDER HAS NO SERVICES YET ──
  if (myServices.length === 0) {
    return (
      <div style={{ flex: 1, padding: '60px 20px', textAlign: 'center', background: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: '#ecfdf5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#047857'
        }}>
          <Plus style={{ width: '40px', height: '40px' }} />
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
          Sizda hali qo'shilgan xizmatlar yo'q
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '440px', lineHeight: 1.5, marginBottom: '28px' }}>
          Buxoro aholisiga o'z xizmatlaringizni taklif qilish va yangi mijozlar topish uchun birinchi e'loningizni qo'shing!
        </p>
        <button
          onClick={onAddNewService}
          style={{
            padding: '16px 32px', background: '#047857', color: '#ffffff',
            border: 'none', borderRadius: '30px', fontSize: '1.05rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            boxShadow: '0 8px 20px rgba(4, 120, 87, 0.3)', transition: 'all 0.2s'
          }}
        >
          <Plus style={{ width: '20px', height: '20px' }} />
          <span>Birinchi xizmatni qo'shish</span>
        </button>
      </div>
    );
  }

  const title = currentService?.title || 'Mening xizmatim';
  const category = currentService?.category || 'Dorixona';
  const phone = currentService?.phone || '+998 90 123 45 67';
  const location = currentService?.location || 'Buxoro shahri';
  const description = currentService?.description || 'Sifatli xizmat ko\'rsatish.';
  const days = currentService?.days || 'Har kuni';
  const timeFrom = currentService?.time_from || '08:00';
  const timeTo = currentService?.time_to || '22:00';
  const bannerImage = currentService?.image_url || CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES['Dorixona'];
  const lat = currentService?.lat || '39.7747';
  const lng = currentService?.lng || '64.4286';
  const status = currentService?.status || 'approved';

  const galleryImages: string[] = (() => {
    const imgs: string[] = [];
    if (currentService?.image_url) imgs.push(currentService.image_url);
    if (currentService?.gallery) {
      try {
        const parsed = JSON.parse(currentService.gallery);
        if (Array.isArray(parsed)) parsed.forEach((u: unknown) => { if (typeof u === 'string' && u && !imgs.includes(u)) imgs.push(u); });
      } catch {
        currentService.gallery.split(',').map(s => s.trim()).forEach(u => { if (u && !imgs.includes(u)) imgs.push(u); });
      }
    }
    return imgs;
  })();

  const tabs = [
    { id: 'umumiy', label: 'Umumiy' },
    { id: 'galereya', label: 'Galereya' },
    { id: 'sharhlar', label: 'Sharhlar' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }}>

      {/* ── MULTI-SERVICE SELECTOR BAR ── */}
      <div style={{
        background: '#ffffff', borderBottom: '1px solid #e2e8f0',
        padding: '12px 32px', display: 'flex', alignItems: 'center',
        gap: '12px', overflowX: 'auto'
      }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
          Mening xizmatlarim ({myServices.length}):
        </span>

        {myServices.map((srv) => {
          const isSelected = srv.id === selectedServiceId;
          const srvImg = srv.image_url || CATEGORY_DEFAULT_IMAGES[srv.category] || '';
          const isPending = srv.status === 'pending';
          return (
            <button
              key={srv.id}
              onClick={() => handleSelectService(srv)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 16px', borderRadius: '20px', border: 'none',
                background: isSelected ? '#047857' : '#f1f5f9',
                color: isSelected ? '#ffffff' : '#334155',
                fontWeight: 700, fontSize: '0.88rem',
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 4px 12px rgba(4,120,87,0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', background: '#e2e8f0' }}>
                <img src={srvImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span>{srv.title}</span>
              {isPending && (
                <span style={{ background: '#f59e0b', color: '#000', fontSize: '0.68rem', padding: '1px 6px', borderRadius: '10px' }}>
                  Kutilmoqda
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={onAddNewService}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 16px', borderRadius: '20px',
            border: '1.5px dashed #047857', background: '#ecfdf5',
            color: '#047857', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', whiteSpace: 'nowrap'
          }}
        >
          <Plus style={{ width: '15px', height: '15px' }} />
          <span>Yangi xizmat qo'shish</span>
        </button>
      </div>

      {/* Pending status warning banner if not approved yet */}
      {status === 'pending' && (
        <div style={{ background: '#fffbeb', borderBottom: '1.5px solid #fde68a', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '10px', color: '#92400e' }}>
          <AlertTriangle style={{ width: '20px', height: '20px', color: '#f59e0b', flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Ushbu xizmat hozirda <strong>Admin tekshiruvida (Moderatsiyada)</strong> turibdi. Admin tasdiqlashi bilan Buxoro ahli uchun asosiy katalogda ko'rinadi.
          </div>
        </div>
      )}

      {status === 'rejected' && (
        <div style={{ background: '#fef2f2', borderBottom: '1.5px solid #fecaca', padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '10px', color: '#991b1b' }}>
          <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444', flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            Ushbu xizmat admin tomonidan rad etilgan. Ma'lumotlarni tahrirlab qayta saqlashingiz mumkin.
          </div>
        </div>
      )}

      {/* Banner — premium hero (to'liq rasm, blur fon) */}
      <div style={{
        height: '320px', position: 'relative',
        background: '#022c22', overflow: 'hidden'
      }}>
        {/* Blur fill background */}
        <img
          src={bannerImage}
          alt=""
          aria-hidden
          onError={(e) => { (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES['Dorixona']; }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', filter: 'blur(30px) brightness(0.5) saturate(1.2)',
            transform: 'scale(1.2)'
          }}
        />
        {/* Full (un-cropped) image */}
        <img
          src={bannerImage}
          alt={title}
          onError={(e) => { (e.target as HTMLImageElement).src = CATEGORY_DEFAULT_IMAGES['Dorixona']; }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'contain', objectPosition: 'center 38%'
          }}
        />
        {/* Bottom gradient for text readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(2,44,34,0.96) 0%, rgba(2,44,34,0.72) 22%, rgba(2,44,34,0.18) 46%, transparent 62%)'
        }} />

        {/* Status pill */}
        <div style={{
          position: 'absolute', top: '20px', right: '24px',
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.22)', borderRadius: '999px',
          padding: '7px 16px', color: '#ffffff', fontWeight: 700, fontSize: '0.82rem'
        }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: status === 'approved' ? '#34d399' : status === 'pending' ? '#fbbf24' : '#f87171',
            boxShadow: `0 0 8px ${status === 'approved' ? '#34d399' : status === 'pending' ? '#fbbf24' : '#f87171'}`
          }} />
          {status === 'approved' ? 'Tasdiqlangan' : status === 'pending' ? 'Moderatsiyada' : 'Rad etilgan'}
        </div>

        {/* Hero text */}
        <div style={{ position: 'absolute', left: '32px', right: '32px', bottom: '22px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'linear-gradient(135deg, #059669, #047857)', color: '#ffffff',
            padding: '5px 14px', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 800,
            marginBottom: '10px', boxShadow: '0 4px 14px rgba(4,120,87,0.45)', letterSpacing: '0.02em'
          }}>
            <CheckCircle style={{ width: '13px', height: '13px' }} />
            {category}
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 10px', textShadow: '0 2px 16px rgba(0,0,0,0.45)', lineHeight: 1.2 }}>
            {title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.92)', fontSize: '0.9rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Star style={{ width: '15px', height: '15px', color: '#fbbf24', fill: '#fbbf24' }} />
              {(currentService?.rating_count || 0) > 0 ? (currentService?.rating || 0).toFixed(1) : '—'}
              <span style={{ color: 'rgba(255,255,255,0.65)' }}>({currentService?.rating_count || 0} ta sharh)</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin style={{ width: '15px', height: '15px', color: '#34d399' }} />
              {location}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock style={{ width: '15px', height: '15px', color: '#34d399' }} />
              {days}, {timeFrom}–{timeTo}
            </span>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div style={{ background: '#fff', padding: '0 32px', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingTop: '18px', paddingBottom: '6px', flexWrap: 'wrap' }}>
          {/* Quick stats chips */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {([
              { icon: <Star style={{ width: '15px', height: '15px', color: '#f59e0b', fill: '#f59e0b' }} />, value: (currentService?.rating_count || 0) > 0 ? (currentService?.rating || 0).toFixed(1) : '—', label: `${currentService?.rating_count || 0} ta sharh` },
              { icon: <Eye style={{ width: '15px', height: '15px', color: '#047857' }} />, value: String(currentService?.views_count || 0), label: 'ko\'rishlar' },
              { icon: <Phone style={{ width: '15px', height: '15px', color: '#047857' }} />, value: String(currentService?.phone_clicks || 0), label: 'qo\'ng\'iroqlar' },
              { icon: <Navigation style={{ width: '15px', height: '15px', color: '#047857' }} />, value: String(currentService?.directions_count || 0), label: 'xarita so\'rovlari' },
            ] as Array<{ icon: React.ReactNode; value: string; label: string }>).map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(180deg, #ffffff, #f8fafc)',
                border: '1px solid #e2e8f0', borderRadius: '14px', padding: '8px 14px',
                boxShadow: '0 2px 8px rgba(15,23,42,0.04)'
              }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', lineHeight: 1.15 }}>{s.value}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (currentService) populateEditForm(currentService);
                setIsEditModalOpen(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: 'linear-gradient(135deg, #059669, #047857)', color: '#ffffff',
                border: 'none', borderRadius: '12px', padding: '10px 18px',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                boxShadow: '0 6px 16px rgba(4,120,87,0.3)', transition: 'all 0.15s'
              }}
            >
              <Edit3 style={{ width: '16px', height: '16px' }} />
              <span>Tahrirlash</span>
            </button>

            <button
              onClick={() => setIsStatsModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#ffffff', color: '#334155', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', padding: '10px 16px', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <BarChart2 style={{ width: '16px', height: '16px', color: '#047857' }} />
              <span>Statistika</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#ffffff', color: '#334155', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', padding: '10px 16px', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <QrCode style={{ width: '16px', height: '16px', color: '#047857' }} />
              <span>QR kod</span>
            </button>

            <button
              onClick={handleShare}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#ffffff', color: '#334155', border: '1.5px solid #e2e8f0',
                borderRadius: '12px', padding: '10px 16px', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <Share2 style={{ width: '16px', height: '16px', color: '#047857' }} />
              <span>Ulashish</span>
            </button>

            <button
              onClick={handleDeleteService}
              title="Xizmatni o'chirish"
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca',
                borderRadius: '12px', padding: '10px 14px', fontWeight: 700,
                fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              <Trash2 style={{ width: '16px', height: '16px' }} />
              <span>O'chirish</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginTop: '16px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 24px', border: 'none', background: 'none',
                fontSize: '0.95rem', fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#047857' : '#64748b',
                borderBottom: activeTab === tab.id ? '2.5px solid #047857' : '2.5px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', padding: '24px 32px' }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Gallery */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Rasmlar galereyasi</span>
              <button
                onClick={() => setIsGalleryModalOpen(true)}
                style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Barchasi <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              <div
                onClick={() => setIsGalleryModalOpen(true)}
                style={{
                  width: '140px', height: '95px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                  border: '2px solid #047857', cursor: 'pointer'
                }}
              >
                <img src={bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.slice(1, 5).map((src, i) => (
                <div
                  key={i}
                  onClick={() => setIsGalleryModalOpen(true)}
                  style={{
                    width: '140px', height: '95px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
                    border: '1px solid #e2e8f0', cursor: 'pointer'
                  }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              <button
                onClick={() => setIsEditModalOpen(true)}
                style={{
                  width: '120px', height: '95px', borderRadius: '12px',
                  border: '2px dashed #cbd5e1', background: '#f8fafc',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', cursor: 'pointer', color: '#047857', flexShrink: 0
                }}
              >
                <Camera style={{ width: '22px', height: '22px' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>Rasm almashtirish</span>
              </button>
            </div>
          </div>

          {/* Info Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Ish vaqti */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock style={{ width: '18px', height: '18px', color: '#047857' }} />
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Ish vaqti</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: 600, color: '#047857' }}>{days}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{timeFrom} – {timeTo}</span>
              </div>
            </div>

            {/* Manzil */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <MapPin style={{ width: '18px', height: '18px', color: '#047857' }} />
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Manzil</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600 }}>{location}</div>
                  <button
                    onClick={handleOpenMap}
                    style={{
                      marginTop: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0',
                      borderRadius: '8px', color: '#047857', padding: '6px 10px',
                      fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    <ExternalLink style={{ width: '14px', height: '14px' }} /> Xaritada ochish
                  </button>
                </div>
                <div
                  onClick={handleOpenMap}
                  style={{
                    width: '70px', height: '60px', borderRadius: '10px', overflow: 'hidden',
                    background: '#e2e8f0', flexShrink: 0, position: 'relative', cursor: 'pointer'
                  }}
                  title="Xaritani ochish"
                >
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=64.3586%2C39.7347%2C64.5086%2C39.8147&layer=mapnik&marker=${lat}%2C${lng}`}
                    style={{ border: 0, width: '200px', height: '160px', marginLeft: '-65px', marginTop: '-50px', pointerEvents: 'none' }}
                    title="map"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Xizmat tavsifi */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <FileText style={{ width: '18px', height: '18px', color: '#047857' }} />
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>Xizmat tavsifi</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
              {description}
            </p>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#047857', fontWeight: 600, fontSize: '0.9rem' }}>
              <Phone style={{ width: '16px', height: '16px' }} />
              <a href={`tel:${phone}`} style={{ color: '#047857', textDecoration: 'none' }}>{phone}</a>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Rating */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Reyting va sharhlar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                </div>
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', marginTop: '4px' }}>
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} style={{ width: '14px', height: '14px', color: s <= Math.round(avgRating) ? '#f59e0b' : '#e2e8f0', fill: s <= Math.round(avgRating) ? '#f59e0b' : '#e2e8f0' }} />
                  ))}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>{currentService?.rating_count || 0} ta sharh</div>
              </div>
              <div style={{ flex: 1 }}>
                {ratingDist.map(bar => (
                  <div key={bar.star} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', width: '10px' }}>{bar.star}</span>
                    <div style={{ flex: 1, height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${(bar.count / distTotal) * 100}%`,
                        background: '#f59e0b', borderRadius: '10px', transition: 'width 0.4s'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', width: '20px', textAlign: 'right' }}>{bar.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>Mijozlar fikri</span>
              {reviews.length > 2 && (
                <button
                  onClick={() => setIsReviewsModalOpen(true)}
                  style={{ background: 'none', border: 'none', color: '#047857', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  Barchasi &gt;
                </button>
              )}
            </div>
            {reviews.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center', padding: '16px 0' }}>
                Hozircha sharhlar yo'q.
              </div>
            ) : reviews.slice(0, 2).map((r, i) => (
              <div key={r.id} style={{ marginBottom: i < 1 ? '14px' : 0, paddingBottom: i < 1 ? '14px' : 0, borderBottom: i < 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '50%', background: '#047857',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0
                  }}>{(r.user_name || r.user_email)[0].toUpperCase()}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>— {r.user_name || 'Foydalanuvchi'}</span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('uz-UZ') : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '1px', margin: '3px 0' }}>
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} style={{ width: '11px', height: '11px', fill: s <= r.rating ? '#f59e0b' : '#e2e8f0', color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }} />
                      ))}
                    </div>
                    {r.comment && (
                      <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0', lineHeight: 1.4, fontStyle: 'italic' }}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Footer */}
          <div style={{ background: '#f0fdf4', borderRadius: '16px', padding: '16px 20px', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
              {[
                { icon: Users, value: String(currentService?.rating_count || 0), label: 'Jami sharhlar', color: '#047857' },
                { icon: Star, value: avgRating > 0 ? avgRating.toFixed(1) : '—', label: "O'rtacha reyting", color: '#f59e0b' },
                { icon: Eye, value: String(currentService?.views_count || 0), label: "Ko'rishlar", color: '#3b82f6' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i}>
                    <Icon style={{ width: '20px', height: '20px', color: s.color, margin: '0 auto 4px auto' }} />
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{s.value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── EDIT MODAL WITH IMAGE UPLOAD ── */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '560px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Xizmatni tahrirlash</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Xizmat rasmi (Banner)
                </label>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div style={{
                    width: '120px', height: '80px', borderRadius: '12px', overflow: 'hidden',
                    border: '2px solid #047857', background: '#f1f5f9', flexShrink: 0
                  }}>
                    {editImageUrl ? (
                      <img src={editImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        <ImageIcon style={{ width: '24px', height: '24px' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '8px 16px', background: '#ecfdf5', border: '1.5px solid #a7f3d0',
                        borderRadius: '10px', color: '#047857', fontWeight: 700, fontSize: '0.85rem',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px'
                      }}
                    >
                      <Camera style={{ width: '16px', height: '16px' }} />
                      <span>Yangi rasm yuklash</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      style={{ display: 'none' }}
                    />
                    <input
                      type="url"
                      placeholder="yoki rasm havolasi (URL)..."
                      value={editImageUrl}
                      onChange={e => setEditImageUrl(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1',
                        borderRadius: '8px', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Tashkilot nomi</label>
                <input
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Telefon raqami</label>
                <input
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Manzil</label>
                <input
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Xizmat tavsifi</label>
                <textarea
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #cbd5e1', borderRadius: '12px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Boshlanish vaqti</label>
                  <input
                    type="time"
                    value={editTimeFrom}
                    onChange={e => setEditTimeFrom(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>Tugash vaqti</label>
                  <input
                    type="time"
                    value={editTimeTo}
                    onChange={e => setEditTimeTo(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #cbd5e1', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{ flex: 1, padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '12px', background: '#fff', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ flex: 2, padding: '12px', border: 'none', borderRadius: '12px', background: '#047857', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ALL GALLERY MODAL ── */}
      {isGalleryModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '700px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Rasmlar Galereyasi</h3>
              <button onClick={() => setIsGalleryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #047857' }}>
                <img src={bannerImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.slice(1).map((src, i) => (
                <div key={i} style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL REVIEWS MODAL ── */}
      {isReviewsModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '540px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Barcha Sharhlar ({reviews.length})</h3>
              <button onClick={() => setIsReviewsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto' }}>
              {reviews.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
                  Hozircha sharhlar yo'q.
                </div>
              ) : reviews.map((r) => (
                <div key={r.id} style={{ background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{r.user_name || 'Foydalanuvchi'}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('uz-UZ') : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '6px' }}>
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} style={{ width: '12px', height: '12px', fill: s <= r.rating ? '#f59e0b' : '#e2e8f0', color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }} />
                    ))}
                  </div>
                  {r.comment && <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.4 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── QR CODE MODAL ── */}
      {isQrModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>QR Kod</h3>
              <button onClick={() => setIsQrModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '20px' }}>
              Mijozlar ushbu QR kodni skanerlab profilingizni ochishlari mumkin.
            </p>
            <div style={{
              width: '200px', height: '200px', margin: '0 auto 20px',
              background: '#f8fafc', border: '2px dashed #047857', borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(window.location.origin + '/#service-' + (currentService?.id || 1))}`}
                alt="QR Code"
                style={{ width: '180px', height: '180px' }}
              />
            </div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>{title}</div>
            <button
              onClick={handleCopyLink}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: '12px',
                background: '#047857', color: '#fff', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {copied ? <Check style={{ width: '18px', height: '18px' }} /> : <Copy style={{ width: '18px', height: '18px' }} />}
              {copied ? 'Havola nusxalandi!' : 'Havolani nusxalash'}
            </button>
          </div>
        </div>
      )}

      {/* ── SHARE MODAL ── */}
      {isShareModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '420px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Ulashish</h3>
              <button onClick={() => setIsShareModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
              Xizmatingiz havolasini ijtimoiy tarmoqlarda ulashing:
            </p>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/#service-' + (currentService?.id || 1))}&text=${encodeURIComponent(title + ' — YaqinXizmat')}`, '_blank')}
                style={{ flex: 1, padding: '12px', background: '#229ED9', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Telegram
              </button>
              <button
                onClick={handleCopyLink}
                style={{ flex: 1, padding: '12px', background: '#ecfdf5', color: '#047857', border: '1.5px solid #a7f3d0', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                {copied ? <Check style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                {copied ? 'Nusxalandi' : 'Nusxa olish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS MODAL ── */}
      {isStatsModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Statistika ko'rsatkichlari</h3>
              <button onClick={() => setIsStatsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: '22px', height: '22px' }} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginBottom: '4px' }}>Jami ko'rishlar</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b' }}>{currentService?.views_count || 1284}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>↑ +15% o'sish</div>
              </div>
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600, marginBottom: '4px' }}>Qo'ng'iroqlar</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#064e3b' }}>{currentService?.phone_clicks || 96}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>↑ +18% o'sish</div>
              </div>
            </div>
            <button
              onClick={() => setIsStatsModalOpen(false)}
              style={{ width: '100%', padding: '12px', background: '#047857', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
