import React, { useState, useEffect } from 'react';
import {
  Home, Briefcase, BarChart2, MessageSquare, Settings, User,
  Bell, Search, Plus, ArrowRight, Eye, Phone, Navigation,
  TrendingUp, ChevronDown, CheckCircle, MapPin, LogOut, ShoppingBag,
  Star, RefreshCw, Calendar, TrendingDown, ShieldCheck, X, Check, Save, Edit3,
  ArrowLeft, Send
} from 'lucide-react';
import { toast } from 'react-toastify';
import { MyServicePage } from './MyServicePage';
import { AddServiceWizard } from './AddServiceWizard';
import { ConfirmLogoutModal } from './ConfirmLogoutModal';
import { PageLoader } from './PageLoader';
import {
  ProviderStats, fetchProviderStatsApi, Message, MessageThread,
  fetchMessageThreadsApi, fetchThreadApi, markThreadReadApi, sendMessageApi,
  fetchUserProfileApi, updateProfileApi
} from '../api';

type NavPage = 'home' | 'services' | 'add_service' | 'stats' | 'messages' | 'settings' | 'profile';

interface ProviderDashboardProps {
  userEmail: string | null;
  authUserData: { email: string; displayName: string; photoURL: string; phone?: string };
  onLogout: () => void;
  onSwitchToCustomer?: () => void;
  onAddService?: () => void;
}

export const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  userEmail,
  authUserData,
  onLogout,
  onSwitchToCustomer,
}) => {
  const [activePage, setActivePage] = useState<NavPage>('home');
  const [pageLoading, setPageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all'>('week');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [statsData, setStatsData] = useState<ProviderStats | null>(null);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState(false);

  // Real messages (threads)
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [openThread, setOpenThread] = useState<MessageThread | null>(null);
  const [threadMsgs, setThreadMsgs] = useState<Message[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Real profile
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCity, setProfileCity] = useState('');
  const [profileBusiness, setProfileBusiness] = useState('');
  const [profileActivity, setProfileActivity] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings mock state
  const [notifTelegram, setNotifTelegram] = useState(true);
  const [notifSms, setNotifSms] = useState(true);

  const displayName = profileName || authUserData.displayName || userEmail?.split('@')[0] || 'Foydalanuvchi';
  const avatarUrl = authUserData.photoURL;

  const handleNavChange = (newPage: NavPage) => {
    if (newPage === activePage) return;
    setPageLoading(true);
    setActivePage(newPage);
    setTimeout(() => {
      setPageLoading(false);
    }, 350);
  };

  const loadStats = async () => {
    try {
      const data = await fetchProviderStatsApi(authUserData.email);
      setStatsData(data);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadMessages = async () => {
    if (!authUserData.email) return;
    setMessagesLoading(true);
    try {
      const data = await fetchMessageThreadsApi(authUserData.email);
      setThreads(data);
      setUnreadCount(data.reduce((s, t) => s + t.unread, 0));
    } catch (e) {
      console.warn(e);
      toast.error("Xabarlarni yuklab bo'lmadi");
    } finally {
      setMessagesLoading(false);
    }
  };

  const openThreadHandler = async (t: MessageThread) => {
    setOpenThread(t);
    setThreadLoading(true);
    try {
      const msgs = await fetchThreadApi(authUserData.email, t.peer_email, t.service_id);
      setThreadMsgs(msgs);
      if (t.unread > 0) {
        await markThreadReadApi(authUserData.email, t.peer_email, t.service_id);
        setThreads(prev => prev.map(x => x === t ? { ...x, unread: 0 } : x));
        setUnreadCount(prev => Math.max(0, prev - t.unread));
      }
    } catch (e) {
      console.warn(e);
      toast.error("Suhbatni yuklab bo'lmadi");
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openThread || !replyText.trim() || sendingReply) return;
    setSendingReply(true);
    try {
      const msg = await sendMessageApi({
        service_id: openThread.service_id,
        sender_email: authUserData.email,
        sender_name: displayName,
        recipient_email: openThread.peer_email,
        body: replyText.trim(),
      });
      setThreadMsgs(prev => [...prev, msg]);
      setReplyText('');
      setThreads(prev => prev.map(x => x === openThread ? { ...x, last_body: msg.body, last_sender: 'me', last_at: msg.created_at } : x));
      toast.success("Javob yuborildi");
    } catch (err) {
      console.error(err);
      toast.error("Xabar yuborilmadi. Qayta urinib ko'ring.");
    } finally {
      setSendingReply(false);
    }
  };

  const loadProfile = async () => {
    if (!authUserData.email) return;
    const p = await fetchUserProfileApi(authUserData.email);
    if (p) {
      setProfileName(p.full_name || '');
      setProfilePhone(p.phone || '');
      setProfileCity(p.city || '');
      setProfileBusiness(p.business_name || '');
      setProfileActivity(p.activity_type || '');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUserData.email) return;
    try {
      await updateProfileApi({
        email: authUserData.email,
        full_name: profileName,
        phone: profilePhone,
        city: profileCity,
        business_name: profileBusiness,
        activity_type: profileActivity,
      });
      setIsEditingProfile(false);
      setProfileSaved(true);
      toast.success("Profil muvaffaqiyatli saqlandi");
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error(err);
      toast.error("Profilni saqlab bo'lmadi");
    }
  };

  useEffect(() => {
    loadStats();
    loadMessages();
    loadProfile();
  }, [authUserData.email]);

  useEffect(() => {
    if (activePage === 'messages') loadMessages();
  }, [activePage]);

  const navItems: { id: NavPage; icon: any; label: string; badge?: number }[] = [
    { id: 'home', icon: Home, label: 'Bosh sahifa' },
    { id: 'services', icon: Briefcase, label: 'Xizmatlarim' },
    { id: 'stats', icon: BarChart2, label: 'Statistika' },
    { id: 'messages', icon: MessageSquare, label: 'Xabarlar', badge: unreadCount || undefined },
    { id: 'settings', icon: Settings, label: 'Sozlamalar' },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  // Haqiqiy ko'rsatkichlar (backenddan)
  const totalViews = statsData?.total_views || 0;
  const totalCalls = statsData?.total_calls || 0;
  const totalDirs = statsData?.total_directions || 0;

  const weeklyStats = [
    { icon: Eye, label: "Ko'rishlar", value: totalViews.toLocaleString(), change: statsData?.views_growth || '+0%' },
    { icon: Phone, label: "Qo'ng'iroqlar", value: totalCalls.toLocaleString(), change: statsData?.calls_growth || '+0%' },
    { icon: Navigation, label: "Yo'nalishlar", value: totalDirs.toLocaleString(), change: statsData?.directions_growth || '+0%' },
  ];

  const quickActions: { icon: any; label: string; page: NavPage }[] = [
    { icon: Briefcase, label: 'Xizmatlarim', page: 'services' },
    { icon: BarChart2, label: 'Statistika', page: 'stats' },
    { icon: MessageSquare, label: 'Sharhlar', page: 'services' },
    { icon: Settings, label: 'Sozlamalar', page: 'settings' },
  ];

  const pageTitle: Record<NavPage, string> = {
    home: 'Kabinet',
    services: 'Mening xizmatim',
    add_service: 'Xizmat qo\'shish',
    stats: 'Haqiqiy Statistika',
    messages: 'Xabarlar markazi',
    settings: 'Sozlamalar',
    profile: 'Mening profilim',
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettingsSuccess(true);
    setTimeout(() => setSavedSettingsSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: '230px', minHeight: '100vh', background: '#ffffff',
        borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
        position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => handleNavChange('home')}>
            <div style={{ width: '36px', height: '36px', background: '#047857', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin style={{ width: '20px', height: '20px', color: '#fff' }} />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#064e3b' }}>
              Yaqin<span style={{ color: '#047857' }}>Xizmat</span>
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: '12px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavChange(item.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px', borderRadius: '12px', border: 'none',
                  background: isActive ? '#ecfdf5' : 'transparent',
                  color: isActive ? '#047857' : '#64748b',
                  fontWeight: isActive ? 700 : 500, fontSize: '0.95rem',
                  cursor: 'pointer', marginBottom: '4px', textAlign: 'left',
                  position: 'relative', transition: 'all 0.15s'
                }}
              >
                <Icon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px', borderRadius: '20px' }}>
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: '#047857', borderRadius: '4px 0 0 4px' }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Switch to customer view */}
        {onSwitchToCustomer && (
          <button
            onClick={onSwitchToCustomer}
            style={{
              margin: '0 12px 10px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px', borderRadius: '12px',
              border: '1.5px solid #a7f3d0', background: '#ecfdf5',
              color: '#047857', fontSize: '0.82rem', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <ShoppingBag style={{ width: '16px', height: '16px' }} />
            <span>Mijoz sahifasiga o'tish</span>
          </button>
        )}

        {/* Logout with Confirmation */}
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          style={{
            margin: '0 12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '12px', border: 'none',
            background: 'transparent', color: '#94a3b8', fontSize: '0.9rem',
            fontWeight: 500, cursor: 'pointer'
          }}
        >
          <LogOut style={{ width: '18px', height: '18px' }} />
          Chiqish
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: '230px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* TOP NAVBAR */}
        <div style={{
          background: '#fff', borderBottom: '1px solid #e2e8f0',
          padding: '0 32px', height: '64px',
          display: 'flex', alignItems: 'center', gap: '16px',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginRight: 'auto' }}>
            {pageTitle[activePage]}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '40px', padding: '8px 18px', width: '280px' }}>
            <Search style={{ width: '16px', height: '16px', color: '#94a3b8', flexShrink: 0 }} />
            <input
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', color: '#334155', width: '100%' }}
            />
          </div>

          <button
            onClick={() => handleNavChange('messages')}
            style={{
              position: 'relative', background: '#f8fafc', border: '1.5px solid #e2e8f0',
              borderRadius: '50%', width: '40px', height: '40px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <Bell style={{ width: '18px', height: '18px', color: '#64748b' }} />
            <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
          </button>

          <div
            onClick={() => handleNavChange('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #047857', background: '#e2e8f0' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>{displayName.split(' ')[0]}</div>
              <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Xizmat ko'rsatuvchi</div>
            </div>
            <ChevronDown style={{ width: '16px', height: '16px', color: '#94a3b8' }} />
          </div>
        </div>

        {/* ── PAGE CONTENT OR LOADING ── */}
        {pageLoading ? (
          <PageLoader text="Sahifa yuklanmoqda..." />
        ) : (
          <>
            {activePage === 'services' && (
              <MyServicePage
                authUserData={authUserData}
                onBack={() => handleNavChange('home')}
                onAddNewService={() => handleNavChange('add_service')}
              />
            )}

            {activePage === 'add_service' && (
              <AddServiceWizard
                authUserData={authUserData}
                onSuccess={() => { handleNavChange('services'); }}
                onCancel={() => handleNavChange('home')}
              />
            )}

            {/* REAL STATS PAGE */}
            {activePage === 'stats' && (
              <div style={{ padding: '28px 32px', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Haqiqiy Ko'rsatkichlar va Tahlil
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                      Neon ma'lumotlar bazasidan jonli olingan statistika
                    </p>
                  </div>
                  <button
                    onClick={loadStats}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 16px', background: '#ffffff', border: '1.5px solid #e2e8f0',
                      borderRadius: '12px', color: '#047857', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    <span>Yangilash</span>
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Jami Ko'rishlar</span>
                      <Eye style={{ width: '20px', height: '20px', color: '#047857' }} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{totalViews.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
                      <TrendingUp style={{ width: '14px', height: '14px' }} />
                      <span>{statsData?.views_growth || '+0%'} o'sish</span>
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Qo'ng'iroqlar</span>
                      <Phone style={{ width: '20px', height: '20px', color: '#047857' }} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{totalCalls.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
                      <TrendingUp style={{ width: '14px', height: '14px' }} />
                      <span>{statsData?.calls_growth || '+0%'} o'sish</span>
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Yo'nalishlar (GPS)</span>
                      <Navigation style={{ width: '20px', height: '20px', color: '#047857' }} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>{totalDirs.toLocaleString()}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
                      <TrendingUp style={{ width: '14px', height: '14px' }} />
                      <span>{statsData?.directions_growth || '+0%'} o'sish</span>
                    </div>
                  </div>

                  <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>O'rtacha Reyting</span>
                      <Star style={{ width: '20px', height: '20px', color: '#f59e0b', fill: '#f59e0b' }} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a' }}>
                      {(statsData?.avg_rating || 0).toFixed(1)} / 5.0
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '6px' }}>
                      {statsData?.rating_count || 0} ta mijoz sharhi asosida
                    </div>
                  </div>
                </div>

                {/* Interactive Weekly Chart Visual */}
                <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
                      Haftalik Faollik Grafigi
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 700, background: '#ecfdf5', padding: '4px 12px', borderRadius: '20px' }}>
                      Dushanba — Yakshanba
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '16px', alignItems: 'flex-end', height: '200px', paddingTop: '20px' }}>
                    {(statsData?.weekly_breakdown || [
                      { day: 'Dush', views: 0, calls: 0 },
                      { day: 'Sesh', views: 0, calls: 0 },
                      { day: 'Chor', views: 0, calls: 0 },
                      { day: 'Pay', views: 0, calls: 0 },
                      { day: 'Jum', views: 0, calls: 0 },
                      { day: 'Shan', views: 0, calls: 0 },
                      { day: 'Yak', views: 0, calls: 0 },
                    ]).map((item, i) => {
                      const maxView = Math.max(10, ...((statsData?.weekly_breakdown || []).map(w => w.views)));
                      const heightPercent = Math.min(100, Math.max(20, (item.views / maxView) * 100));
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#047857' }}>
                            {item.views}
                          </span>
                          <div style={{
                            width: '100%', maxWidth: '42px', height: `${heightPercent}%`,
                            background: 'linear-gradient(to top, #047857, #10b981)',
                            borderRadius: '10px 10px 4px 4px',
                            transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                          <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGES TAB */}
            {activePage === 'messages' && (
              <div style={{ padding: '28px 32px', flex: 1, maxWidth: '800px' }}>
                {!openThread ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                        Xabarlar {unreadCount > 0 && <span style={{ color: '#047857' }}>({unreadCount} ta yangi)</span>}
                      </h2>
                      <button
                        onClick={loadMessages}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', color: '#047857', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        <RefreshCw style={{ width: '15px', height: '15px' }} />
                        <span>Yangilash</span>
                      </button>
                    </div>

                    {messagesLoading ? (
                      <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Xabarlar yuklanmoqda...</div>
                    ) : threads.length === 0 ? (
                      <div style={{ background: '#fff', borderRadius: '16px', padding: '48px 24px', textAlign: 'center', border: '1px dashed #e2e8f0' }}>
                        <MessageSquare style={{ width: '44px', height: '44px', color: '#cbd5e1', margin: '0 auto 14px' }} />
                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Hozircha xabarlar yo'q</div>
                        <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                          Mijozlar sizning xizmatlaringizga xabar yuborganda, ular shu yerda ko'rinadi.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {threads.map((t) => (
                          <div
                            key={`${t.peer_email}-${t.service_id}`}
                            onClick={() => openThreadHandler(t)}
                            style={{
                              background: '#ffffff', borderRadius: '16px', padding: '18px 20px',
                              border: t.unread > 0 ? '1.5px solid #a7f3d0' : '1px solid #e2e8f0',
                              boxShadow: t.unread > 0 ? '0 4px 12px rgba(4,120,87,0.06)' : 'none',
                              display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer'
                            }}
                          >
                            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: t.unread > 0 ? '#047857' : '#e2e8f0', color: t.unread > 0 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                              {(t.peer_name || t.peer_email)[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', gap: '10px' }}>
                                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                                  {t.peer_name || t.peer_email}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                  {t.last_at ? new Date(t.last_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              {t.service_title && (
                                <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700, marginBottom: '3px' }}>{t.service_title}</div>
                              )}
                              <p style={{ color: '#475569', fontSize: '0.9rem', margin: 0, lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.last_sender === 'me' ? 'Siz: ' : ''}{t.last_body}
                              </p>
                            </div>
                            {t.unread > 0 && (
                              <div style={{ background: '#047857', color: '#fff', borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, marginTop: '4px' }}>
                                {t.unread}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                      <button
                        onClick={() => { setOpenThread(null); loadMessages(); }}
                        style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '8px 12px', cursor: 'pointer', color: '#047857', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.85rem' }}
                      >
                        <ArrowLeft style={{ width: '15px', height: '15px' }} /> Orqaga
                      </button>
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                          {openThread.peer_name || openThread.peer_email}
                        </h2>
                        {openThread.service_title && (
                          <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>{openThread.service_title}</div>
                        )}
                      </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', minHeight: '300px', maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {threadLoading ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Suhbat yuklanmoqda...</div>
                      ) : (
                        threadMsgs.map((m) => {
                          const mine = m.sender_email === authUserData.email;
                          return (
                            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                              <div style={{
                                background: mine ? '#047857' : '#ffffff',
                                color: mine ? '#fff' : '#0f172a',
                                border: mine ? 'none' : '1px solid #e2e8f0',
                                borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                                padding: '10px 14px', fontSize: '0.9rem', lineHeight: 1.5,
                                boxShadow: '0 2px 6px rgba(15,23,42,0.05)'
                              }}>
                                {m.body}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px', textAlign: mine ? 'right' : 'left' }}>
                                {m.created_at ? new Date(m.created_at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <input
                        type="text"
                        placeholder="Javobingizni yozing..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '14px', padding: '12px 16px', fontSize: '0.95rem', outline: 'none', color: '#0f172a' }}
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#047857', color: '#fff', border: 'none', borderRadius: '14px', padding: '12px 20px', fontWeight: 700, cursor: sendingReply ? 'not-allowed' : 'pointer', opacity: sendingReply || !replyText.trim() ? 0.6 : 1 }}
                      >
                        <Send style={{ width: '16px', height: '16px' }} />
                        <span>{sendingReply ? 'Yuborilmoqda...' : 'Yuborish'}</span>
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* SETTINGS TAB */}
            {activePage === 'settings' && (
              <div style={{ padding: '28px 32px', flex: 1, maxWidth: '640px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '20px' }}>
                  Kabinet Sozlamalari
                </h2>
                
                {savedSettingsSuccess && (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Check style={{ width: '18px', height: '18px' }} />
                    <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
                  </div>
                )}

                <form onSubmit={handleSaveSettings} style={{ background: '#ffffff', borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Bildirishnomalar</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                        <input type="checkbox" checked={notifTelegram} onChange={e => setNotifTelegram(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#047857' }} />
                        <span>Telegram orqali yangi buyurtmalarni olish</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#334155' }}>
                        <input type="checkbox" checked={notifSms} onChange={e => setNotifSms(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#047857' }} />
                        <span>SMS orqali ogohlantirishlar</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Bog'langan hisob</h4>
                    <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', fontSize: '0.88rem', color: '#64748b' }}>
                      Email: <strong style={{ color: '#0f172a' }}>{userEmail}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: '14px', background: '#047857', color: '#ffffff',
                      border: 'none', borderRadius: '12px', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '8px', marginTop: '10px'
                    }}
                  >
                    <Save style={{ width: '18px', height: '18px' }} />
                    <span>Sozlamalarni saqlash</span>
                  </button>
                </form>
              </div>
            )}

            {/* PROFILE TAB */}
            {activePage === 'profile' && (
              <div style={{ padding: '40px 32px', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ background: '#fff', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0' }}>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 auto 16px' }}>
                      {displayName[0]?.toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>{displayName}</h3>
                    <div style={{ color: '#047857', fontWeight: 700, fontSize: '0.9rem' }}>Xizmat ko'rsatuvchi</div>
                  </div>

                  {profileSaved && (
                    <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '12px 16px', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Check style={{ width: '18px', height: '18px' }} />
                      <span>Profil saqlandi!</span>
                    </div>
                  )}

                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { label: 'To\'liq ism', value: profileName, set: setProfileName, placeholder: 'Ismingiz' },
                        { label: 'Telefon', value: profilePhone, set: setProfilePhone, placeholder: '+998 90 123 45 67' },
                        { label: 'Shahar', value: profileCity, set: setProfileCity, placeholder: 'Buxoro' },
                        { label: 'Biznes nomi', value: profileBusiness, set: setProfileBusiness, placeholder: 'Masalan: Shifo Farm' },
                        { label: 'Faoliyat turi', value: profileActivity, set: setProfileActivity, placeholder: 'Masalan: Santexnika' },
                      ].map((f, i) => (
                        <div key={i}>
                          <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '5px', fontWeight: 600 }}>{f.label}</div>
                          <input
                            type="text"
                            value={f.value}
                            placeholder={f.placeholder}
                            onChange={e => f.set(e.target.value)}
                            style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box', color: '#0f172a' }}
                          />
                        </div>
                      ))}
                      <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '5px', fontWeight: 600 }}>Email (o'zgartirib bo'lmaydi)</div>
                      <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', fontSize: '0.92rem', color: '#334155', fontWeight: 600, border: '1px solid #e2e8f0' }}>{userEmail}</div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          style={{ flex: 1, padding: '13px', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="submit"
                          style={{ flex: 2, padding: '13px', background: '#047857', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <Save style={{ width: '17px', height: '17px' }} />
                          <span>Saqlash</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '18px' }}>
                        {[
                          { label: 'To\'liq ism', value: profileName || '—' },
                          { label: 'Telefon', value: profilePhone || '—' },
                          { label: 'Shahar', value: profileCity || '—' },
                          { label: 'Biznes nomi', value: profileBusiness || '—' },
                          { label: 'Faoliyat turi', value: profileActivity || '—' },
                          { label: 'Email', value: userEmail || '—' },
                        ].map((row, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 5 ? '1px solid #eef2f6' : 'none' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{row.label}:</span>
                            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', textAlign: 'right' }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        style={{ width: '100%', padding: '14px', background: '#047857', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
                      >
                        <Edit3 style={{ width: '18px', height: '18px' }} />
                        <span>Profilni tahrirlash</span>
                      </button>
                      <button
                        onClick={() => setIsLogoutModalOpen(true)}
                        style={{ width: '100%', padding: '14px', background: '#fee2e2', border: 'none', borderRadius: '14px', color: '#ef4444', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                        <span>Hisobdan chiqish</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* HOME DASHBOARD */}
            {activePage === 'home' && (
              <div style={{ padding: '28px 32px', flex: 1 }}>
                {/* Hero */}
                <div style={{
                  background: 'linear-gradient(135deg, #047857 0%, #065f46 60%, #064e3b 100%)',
                  borderRadius: '20px', padding: '32px 36px', marginBottom: '24px',
                  position: 'relative', overflow: 'hidden', minHeight: '140px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
                      Assalomu alaykum, {displayName.split(' ')[0]}! 👋
                    </h2>
                    <p style={{ color: '#a7f3d0', fontSize: '0.95rem', margin: '0 0 4px' }}>
                      Bugun ham muvaffaqiyatli kun bo'lsin!
                    </p>
                    <p style={{ color: '#6ee7b7', fontSize: '0.88rem', margin: 0 }}>
                      Buxoro ahli uchun sizning xizmatlaringiz muhim.
                    </p>
                  </div>
                  <div style={{ position: 'absolute', right: '32px', top: '50%', transform: 'translateY(-50%)', textAlign: 'right', zIndex: 2 }}>
                    <div style={{ fontSize: '0.85rem', color: '#a7f3d0', fontStyle: 'italic', lineHeight: 1.6 }}>
                      Mahalliy xizmat —<br />yanada yaqinroq<br />jamiyat!
                    </div>
                  </div>
                  <div style={{ position: 'absolute', right: '220px', top: '-30px', width: '160px', height: '160px', background: 'rgba(255,255,255,0.06)', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', right: '160px', top: '20px', width: '80px', height: '80px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%' }} />
                </div>

                {/* Business Status + Weekly Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* Business Status Card (CLICKABLE -> MODAL) */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '52px', height: '52px', background: '#f0fdf4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #bbf7d0' }}>
                        <Briefcase style={{ width: '24px', height: '24px', color: '#047857' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Biznes holati</div>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Biznesingiz holati</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsStatusModalOpen(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        background: '#f0fdf4', borderRadius: '12px', padding: '12px 16px',
                        border: '1px solid #bbf7d0', cursor: 'pointer', width: '100%', textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      <CheckCircle style={{ width: '20px', height: '20px', color: '#047857' }} />
                      <div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#047857' }}>✅ Tasdiqlangan</div>
                        <div style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>Xizmatlaringiz faol.</div>
                      </div>
                      <ArrowRight style={{ width: '16px', height: '16px', color: '#047857', marginLeft: 'auto' }} />
                    </button>
                  </div>

                  {/* Weekly Stats with Interactive Time Dropdown */}
                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative' }}>
                      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Ko'rsatkichlar</span>
                      
                      {/* Filter Button */}
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: '#f8fafc', border: '1.5px solid #e2e8f0',
                            borderRadius: '20px', padding: '6px 14px', fontSize: '0.82rem',
                            color: '#047857', cursor: 'pointer', fontWeight: 700
                          }}
                        >
                          <span>{timeFilter === 'week' ? 'Bu hafta' : timeFilter === 'month' ? 'Bu oy' : 'Barcha vaqt'}</span>
                          <ChevronDown style={{ width: '14px', height: '14px' }} />
                        </button>

                        {isFilterDropdownOpen && (
                          <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: '6px',
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, minWidth: '130px',
                            overflow: 'hidden'
                          }}>
                            {[
                              { id: 'week', label: 'Bu hafta' },
                              { id: 'month', label: 'Bu oy' },
                              { id: 'all', label: 'Barcha vaqt' }
                            ].map(opt => (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  setTimeFilter(opt.id as any);
                                  setIsFilterDropdownOpen(false);
                                }}
                                style={{
                                  width: '100%', padding: '10px 14px', border: 'none',
                                  background: timeFilter === opt.id ? '#ecfdf5' : '#fff',
                                  color: timeFilter === opt.id ? '#047857' : '#334155',
                                  fontWeight: timeFilter === opt.id ? 700 : 500,
                                  fontSize: '0.85rem', textAlign: 'left', cursor: 'pointer'
                                }}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                      {weeklyStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                          <div key={i} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleNavChange('stats')}>
                            <div style={{ width: '40px', height: '40px', background: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', border: '1.5px solid #d1fae5' }}>
                              <Icon style={{ width: '20px', height: '20px', color: '#047857' }} />
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{stat.value}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '4px' }}>
                              <TrendingUp style={{ width: '12px', height: '12px', color: '#047857' }} />
                              <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>{stat.change}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Add Service + Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <button onClick={() => handleNavChange('add_service')} style={{
                    background: 'linear-gradient(135deg, #047857, #065f46)', borderRadius: '16px',
                    border: 'none', padding: '28px 32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', boxShadow: '0 8px 24px rgba(4,120,87,0.3)', transition: 'all 0.15s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
                        <Plus style={{ width: '24px', height: '24px', color: '#fff' }} />
                      </div>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Yangi xizmat qo'shish</span>
                    </div>
                    <ArrowRight style={{ width: '24px', height: '24px', color: '#6ee7b7' }} />
                  </button>

                  <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748b', marginBottom: '16px' }}>Tezkor amallar</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                          <button key={i} onClick={() => handleNavChange(action.page)} style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                            background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '12px',
                            padding: '14px 8px', cursor: 'pointer', transition: 'all 0.15s'
                          }}>
                            <div style={{ width: '36px', height: '36px', background: '#ecfdf5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Icon style={{ width: '18px', height: '18px', color: '#047857' }} />
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textAlign: 'center' }}>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Promo Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', borderRadius: '16px',
                  padding: '28px 36px', border: '1.5px solid #bbf7d0',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#065f46', margin: '0 0 6px' }}>
                      Buxoroning har bir mijoziga yaqinroq bo'ling!
                    </h3>
                    <p style={{ color: '#047857', fontSize: '0.92rem', margin: 0, fontWeight: 500 }}>
                      Sifatli xizmat — barqaror biznes.
                    </p>
                  </div>
                  <button onClick={() => handleNavChange('add_service')} style={{
                    background: '#047857', color: '#fff', border: 'none', borderRadius: '40px',
                    padding: '12px 28px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap', boxShadow: '0 6px 16px rgba(4,120,87,0.25)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  >
                    <Plus style={{ width: '18px', height: '18px' }} />
                    Xizmat qo'shish
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── STATUS VERIFIED MODAL ── */}
      {isStatusModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }} onClick={() => setIsStatusModalOpen(false)}>
          <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#047857' }}>
              <ShieldCheck style={{ width: '36px', height: '36px' }} />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
              Biznesingiz Tasdiqlangan!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
              Sizning profil va xizmatlaringiz YaqinXizmat moderatsiyasidan to'liq o'tgan. Barcha xizmatlaringiz Buxoro xaritasida va qidiruvda faol ko'rinmoqda.
            </p>
            <button
              onClick={() => setIsStatusModalOpen(false)}
              style={{ width: '100%', padding: '14px', background: '#047857', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRM LOGOUT MODAL ── */}
      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
};
