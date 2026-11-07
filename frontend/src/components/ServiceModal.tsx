import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, Phone, UserCheck, ShieldCheck, Clock, MessageSquare, Send, ChevronLeft, ChevronRight, Navigation, Expand, Crosshair } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Service, Review, Message, trackServiceCallApi, trackServiceDirectionApi,
  fetchReviewsApi, createReviewApi, sendMessageApi, fetchServiceById, fetchThreadApi
} from '../api';
import IconChip from './IconChip';
import MiniMap from './MiniMap';
import { BUKHARA_CENTER, LatLng, formatDistance, distanceMeters } from '../utils/geo';
import { osmMarkerLink } from '../utils/route';

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  userEmail?: string | null;
  userName?: string;
  onRequireLogin?: () => void;
  onServiceUpdated?: (updated: Service) => void;
  userPos?: LatLng | null;
  onLocate?: () => void;
  onOpenDirections?: (dest: LatLng, name: string) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Dorixona': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=800&q=80',
  'Santexnika': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80',
  'Elektrik': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
  'Go\'zallik': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  'Tozalash': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
  'Ta\'lim': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
  'Avto': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
};

export const ServiceModal: React.FC<ServiceModalProps> = ({
  service, onClose, userEmail, userName, onRequireLogin, onServiceUpdated, userPos, onLocate, onOpenDirections
}) => {
  const [tab, setTab] = useState<'info' | 'sharhlar' | 'xabar'>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [liveService, setLiveService] = useState<Service | null>(service);

  // Review form
  const [myRating, setMyRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Message thread
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [threadMsgs, setThreadMsgs] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  // Gallery
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    setTab('info');
    setReviews([]);
    setMyRating(5);
    setMyComment('');
    setThreadMsgs([]);
    setActiveImg(0);
    setLiveService(service);
  }, [service?.id]);

  useEffect(() => {
    if (service && (tab === 'sharhlar')) {
      loadReviews();
    }
  }, [tab, service?.id]);

  useEffect(() => {
    if (service && tab === 'xabar' && userEmail && service.owner_email) {
      setThreadLoading(true);
      fetchThreadApi(userEmail, service.owner_email, service.id)
        .then(setThreadMsgs)
        .catch(() => setThreadMsgs([]))
        .finally(() => setThreadLoading(false));
    }
  }, [tab, service?.id, userEmail]);

  if (!service || !liveService) return null;

  const loadReviews = async () => {
    setReviewsLoading(true);
    const data = await fetchReviewsApi(service.id);
    setReviews(data);
    setReviewsLoading(false);
  };

  const destPos: LatLng = (() => {
    const lat = parseFloat(String(service.lat));
    const lng = parseFloat(String(service.lng));
    return Number.isNaN(lat) || Number.isNaN(lng) ? BUKHARA_CENTER : { lat, lng };
  })();
  const straightDistance = userPos ? distanceMeters(userPos, destPos.lat, destPos.lng) : null;

  const handleOpenRoute = () => {
    onOpenDirections?.(destPos, service.title);
  };

  const handleCallClick = () => {
    trackServiceCallApi(service.id);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) { onRequireLogin?.(); return; }
    setSubmittingReview(true);
    try {
      const created = await createReviewApi(service.id, {
        service_id: service.id,
        user_email: userEmail,
        user_name: userName || userEmail.split('@')[0],
        rating: myRating,
        comment: myComment.trim() || undefined,
      });
      setReviews(prev => [created, ...prev]);
      setMyComment('');
      setMyRating(5);
      toast.success('Sharhingiz qo\'shildi. Rahmat!');
      const fresh = await fetchServiceById(service.id);
      if (fresh) { setLiveService(fresh); onServiceUpdated?.(fresh); }
    } catch {
      toast.error('Sharh qo\'shishda xatolik yuz berdi.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail) { onRequireLogin?.(); return; }
    if (!msgBody.trim()) return;
    const recipient = service.owner_email;
    if (!recipient) { toast.error('Bu xizmat egasi bilan bog\'lanish imkoni yo\'q.'); return; }
    setSendingMsg(true);
    try {
      const sent = await sendMessageApi({
        service_id: service.id,
        sender_email: userEmail,
        sender_name: userName || userEmail.split('@')[0],
        recipient_email: recipient,
        body: msgBody.trim(),
      });
      setThreadMsgs(prev => [...prev, sent]);
      setMsgBody('');
      toast.success('Xabaringiz yuborildi!');
    } catch {
      toast.error('Xabar yuborishda xatolik yuz berdi.');
    } finally {
      setSendingMsg(false);
    }
  };

  const defaultImg = CATEGORY_IMAGES[service.category] || CATEGORY_IMAGES['Santexnika'];
  const galleryImages: string[] = (() => {
    const imgs: string[] = [];
    if (service.image_url) imgs.push(service.image_url);
    if (service.gallery) {
      try {
        const parsed = JSON.parse(service.gallery);
        if (Array.isArray(parsed)) parsed.forEach((u: unknown) => {
          if (typeof u === 'string' && u && !imgs.includes(u)) imgs.push(u);
        });
      } catch {
        service.gallery.split(',').map(s => s.trim()).forEach(u => {
          if (u && !imgs.includes(u)) imgs.push(u);
        });
      }
    }
    return imgs;
  })();
  const displayImage = galleryImages[Math.min(activeImg, galleryImages.length - 1)] || defaultImg;
  const ratingValue = liveService.rating ?? 0;
  const ratingCount = liveService.rating_count ?? 0;

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length
  }));
  const distTotal = reviews.length || 1;

  const tabBtn = (id: typeof tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      style={{
        flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
        background: tab === id ? '#047857' : 'transparent',
        color: tab === id ? '#ffffff' : '#64748b',
        fontWeight: 700, fontSize: '0.88rem', borderRadius: '10px'
      }}
    >
      {label}
    </button>
  );

  return createPortal(
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 999 }}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: 'calc(100dvh - 36px)', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#ffffff', color: '#0f172a', borderRadius: '24px' }}>
        <div style={{ position: 'relative', height: 'clamp(180px, 30vh, 280px)', flexShrink: 0, width: '100%', background: '#0f172a', overflow: 'hidden' }}>
          <img
            src={displayImage}
            alt=""
            aria-hidden
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImg; }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(0.5) saturate(1.2)', transform: 'scale(1.2)' }}
          />
          <img
            src={displayImage}
            alt={service.title}
            onError={(e) => { (e.target as HTMLImageElement).src = defaultImg; }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center 42%' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,23,42,0.55) 0%, transparent 45%)' }} />
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(15, 23, 42, 0.75)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={() => setActiveImg(i => (i - 1 + galleryImages.length) % galleryImages.length)}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
              >
                <ChevronLeft style={{ width: '20px', height: '20px' }} />
              </button>
              <button
                onClick={() => setActiveImg(i => (i + 1) % galleryImages.length)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(15, 23, 42, 0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
              >
                <ChevronRight style={{ width: '20px', height: '20px' }} />
              </button>
              <div style={{ position: 'absolute', bottom: '44px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
                {galleryImages.map((_, i) => (
                  <span key={i} style={{ width: i === activeImg ? '16px' : '7px', height: '7px', borderRadius: '4px', background: i === activeImg ? '#10b981' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }} />
                ))}
              </div>
            </>
          )}
          <div style={{ position: 'absolute', bottom: '14px', left: '16px', background: '#047857', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', zIndex: 2 }}>
            {service.category}
          </div>
          {galleryImages.length > 1 && (
            <div style={{ position: 'absolute', bottom: '14px', right: '16px', background: 'rgba(15, 23, 42, 0.75)', padding: '4px 10px', borderRadius: '14px', fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', zIndex: 2 }}>
              {activeImg + 1} / {galleryImages.length}
            </div>
          )}
        </div>
        {galleryImages.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', padding: '10px 16px', background: '#ffffff', overflowX: 'auto', flexShrink: 0 }}>
            {galleryImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                onClick={() => setActiveImg(i)}
                style={{ height: '52px', width: '72px', objectFit: 'cover', borderRadius: '10px', cursor: 'pointer', flexShrink: 0, border: i === activeImg ? '2px solid #047857' : '2px solid transparent', opacity: i === activeImg ? 1 : 0.7, transition: 'all 0.15s' }}
              />
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', padding: '12px 24px 0', background: '#f1f5f9', flexShrink: 0 }}>
          {tabBtn('info', 'Ma\'lumot')}
          {tabBtn('sharhlar', `Sharhlar (${ratingCount})`)}
          {tabBtn('xabar', 'Xabar yozish')}
        </div>

        <div style={{ padding: '20px 24px 24px', background: '#f1f5f9', flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* ── INFO TAB ── */}
          {tab === 'info' && (
            <div className="page-transition-scale">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700 }}>
                  <Star style={{ width: '18px', height: '18px', fill: '#f59e0b' }} />
                  <span>{ratingCount > 0 ? ratingValue.toFixed(1) : '—'} {ratingCount > 0 ? `(${ratingCount} ta sharh)` : '(hali sharh yo\'q)'}</span>
                </div>
                {service.price && service.price > 0 ? (
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857' }}>
                    {service.price.toLocaleString('uz-UZ')} so'm
                  </span>
                ) : (
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '4px 10px', borderRadius: '10px' }}>
                    Kelishilgan narxda
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                {service.title}
              </h2>

              <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px', background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {service.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div className="yx-info-row">
                  <IconChip icon={<UserCheck style={{ width: 17, height: 17 }} />} tone="emerald" />
                  <span>Mas'ul shaxs: <strong>{service.provider_name}</strong></span>
                </div>
                {service.days && (
                  <div className="yx-info-row">
                    <IconChip icon={<Clock style={{ width: 17, height: 17 }} />} tone="sky" />
                    <span>Ish vaqti: <strong>{service.days} ({service.time_from || '08:00'}–{service.time_to || '22:00'})</strong></span>
                  </div>
                )}
                <div className="yx-info-row">
                  <IconChip icon={<ShieldCheck style={{ width: 17, height: 17 }} />} tone="violet" />
                  <span>Tasdiqlangan va kafolatlangan xizmat</span>
                </div>
              </div>

              <div className="yx-loc-card">
                <div className="yx-loc-head">
                  <IconChip icon={<MapPin style={{ width: 17, height: 17 }} />} tone="rose" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="yx-loc-label">Manzil</div>
                    <div className="yx-loc-address">{service.location}</div>
                  </div>
                  {straightDistance !== null && (
                    <span className="yx-loc-distance">{formatDistance(straightDistance)}</span>
                  )}
                </div>

                <MiniMap center={destPos} userPos={userPos} onClick={handleOpenRoute} />

                <div className="yx-loc-actions">
                  <button className="yx-loc-primary" onClick={handleOpenRoute}>
                    <Navigation style={{ width: 16, height: 16 }} />
                    <span>Yo'l ko'rsatish</span>
                  </button>
                  {!userPos && onLocate && (
                    <button className="yx-loc-ghost" onClick={onLocate}>
                      <Crosshair style={{ width: 16, height: 16 }} />
                      <span>Meni topish</span>
                    </button>
                  )}
                  <a
                    className="yx-loc-ghost"
                    href={osmMarkerLink(destPos.lat, destPos.lng)}
                    target="_blank" rel="noreferrer"
                    onClick={() => trackServiceDirectionApi(service.id)}
                  >
                    <Expand style={{ width: 16, height: 16 }} />
                    <span>Katta xarita</span>
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={`tel:${service.phone}`}
                  onClick={handleCallClick}
                  style={{
                    flex: 1, padding: '14px', fontSize: '1rem', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: '#047857', color: '#ffffff', borderRadius: '30px', fontWeight: 700,
                    boxShadow: '0 6px 18px rgba(4,120,87,0.3)', boxSizing: 'border-box'
                  }}
                >
                  <Phone style={{ width: '18px', height: '18px' }} />
                  <span>Qo'ng'iroq</span>
                </a>
                <button
                  onClick={() => { if (!userEmail) { onRequireLogin?.(); return; } setTab('xabar'); }}
                  style={{
                    flex: 1, padding: '14px', fontSize: '1rem', background: '#ffffff', color: '#047857',
                    border: '2px solid #a7f3d0', borderRadius: '30px', fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <MessageSquare style={{ width: '18px', height: '18px' }} />
                  <span>Xabar</span>
                </button>
              </div>
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {tab === 'sharhlar' && (
            <div className="page-transition-scale">
              {/* Summary */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                  <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {ratingCount > 0 ? ratingValue.toFixed(1) : '—'}
                  </div>
                  <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '6px 0' }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} style={{ width: '13px', height: '13px', fill: s <= Math.round(ratingValue) ? '#f59e0b' : '#e2e8f0', color: s <= Math.round(ratingValue) ? '#f59e0b' : '#e2e8f0' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{ratingCount} ta sharh</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {ratingDist.map(d => (
                    <div key={d.star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#64748b', width: '12px' }}>{d.star}</span>
                      <Star style={{ width: '11px', height: '11px', fill: '#f59e0b', color: '#f59e0b' }} />
                      <div style={{ flex: 1, height: '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(d.count / distTotal) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '4px', transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', width: '18px', textAlign: 'right' }}>{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit review */}
              <form onSubmit={handleSubmitReview} style={{ background: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                  {userEmail ? 'Sharh qoldiring' : 'Sharh qoldirish uchun tizimga kiring'}
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      type="button"
                      key={s}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setMyRating(s)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                    >
                      <Star style={{
                        width: '28px', height: '28px',
                        fill: s <= (hoverRating || myRating) ? '#f59e0b' : '#e2e8f0',
                        color: s <= (hoverRating || myRating) ? '#f59e0b' : '#e2e8f0',
                        transition: 'all 0.15s'
                      }} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={myComment}
                  onChange={(e) => setMyComment(e.target.value)}
                  placeholder="Fikringizni yozing (ixtiyoriy)..."
                  rows={3}
                  style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '11px 14px', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '12px' }}
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    width: '100%', padding: '12px', background: '#047857', color: '#fff', border: 'none',
                    borderRadius: '12px', fontWeight: 700, fontSize: '0.95rem', cursor: submittingReview ? 'not-allowed' : 'pointer',
                    opacity: submittingReview ? 0.7 : 1
                  }}
                >
                  {submittingReview ? 'Yuborilmoqda...' : 'Sharhni yuborish'}
                </button>
              </form>

              {/* Reviews list */}
              {reviewsLoading ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: '20px', fontSize: '0.9rem' }}>Yuklanmoqda...</div>
              ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px', fontSize: '0.9rem', background: '#fff', borderRadius: '16px', border: '1px dashed #e2e8f0' }}>
                  Hozircha sharhlar yo'q. Birinchi bo'lib fikr bildiring!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#047857', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {(r.user_name || r.user_email)[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{r.user_name || 'Foydalanuvchi'}</div>
                          <div style={{ display: 'flex', gap: '1px' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} style={{ width: '11px', height: '11px', fill: s <= r.rating ? '#f59e0b' : '#e2e8f0', color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }} />
                            ))}
                          </div>
                        </div>
                        {r.created_at && (
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {new Date(r.created_at).toLocaleDateString('uz-UZ')}
                          </span>
                        )}
                      </div>
                      {r.comment && <div style={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.5 }}>{r.comment}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MESSAGE TAB ── */}
          {tab === 'xabar' && (
            <div className="page-transition-scale">
              {!userEmail ? (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <MessageSquare style={{ width: '40px', height: '40px', color: '#94a3b8', margin: '0 auto 12px' }} />
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Xabar yozish uchun kiring</div>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Xizmat ko'rsatuvchiga xabar yuborish uchun avval tizimga kiring.
                  </p>
                  <button
                    onClick={() => onRequireLogin?.()}
                    style={{ padding: '11px 24px', background: '#047857', color: '#fff', border: 'none', borderRadius: '30px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Tizimga kirish
                  </button>
                </div>
              ) : !service.owner_email ? (
                <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#64748b' }}>
                  Bu xizmat egasi bilan xabar almashish imkoni yo'q. Qo'ng'iroq qilishdan foydalaning.
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#047857', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem' }}>
                      {(service.provider_name || 'X')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{service.provider_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{service.title}</div>
                    </div>
                  </div>

                  <div style={{ padding: '16px', minHeight: '180px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', background: '#f1f5f9' }}>
                    {threadLoading ? (
                      <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem', padding: '20px 0' }}>Yuklanmoqda...</div>
                    ) : threadMsgs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.86rem', padding: '30px 10px' }}>
                        Hozircha xabar yo'q. Birinchi xabarni siz yozing!
                      </div>
                    ) : threadMsgs.map(m => {
                      const mine = m.sender_email === userEmail;
                      return (
                        <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{
                            maxWidth: '80%', padding: '10px 14px', fontSize: '0.9rem', lineHeight: 1.45,
                            background: mine ? '#047857' : '#ffffff',
                            color: mine ? '#ffffff' : '#0f172a',
                            border: mine ? 'none' : '1px solid #e2e8f0',
                            borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            boxShadow: mine ? '0 3px 10px rgba(4,120,87,0.25)' : '0 1px 4px rgba(15,23,42,0.06)',
                            wordBreak: 'break-word'
                          }}>
                            {m.body}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '3px' }}>
                            {mine ? 'Siz' : (m.sender_name || service.provider_name)}
                            {m.created_at ? ` · ${new Date(m.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', padding: '12px 14px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
                    <input
                      type="text"
                      value={msgBody}
                      onChange={(e) => setMsgBody(e.target.value)}
                      placeholder="Salom! Savolim bor edi..."
                      style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '24px', padding: '11px 16px', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                    <button
                      type="submit"
                      disabled={sendingMsg || !msgBody.trim()}
                      style={{
                        padding: '11px 18px', background: '#047857', color: '#fff', border: 'none',
                        borderRadius: '24px', fontWeight: 700, fontSize: '0.9rem', cursor: (sendingMsg || !msgBody.trim()) ? 'not-allowed' : 'pointer',
                        opacity: (sendingMsg || !msgBody.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      <Send style={{ width: '16px', height: '16px' }} />
                      <span>{sendingMsg ? '...' : 'Yuborish'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
