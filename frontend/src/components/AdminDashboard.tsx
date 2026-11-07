import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  ShieldCheck, Check, X, Trash2, Eye, Phone, MapPin, Users,
  Briefcase, AlertTriangle, Search, Filter, RefreshCw, Star,
  LogOut, Clock, ChevronRight, CheckCircle2, XCircle, BarChart3,
  ExternalLink, UserCheck, ShieldAlert, PlusCircle
} from 'lucide-react';
import {
  Service,
  ServiceCreateData,
  UserData,
  AdminStats,
  fetchAdminServices,
  updateServiceStatusApi,
  adminCreateServiceApi,
  deleteServiceApi,
  fetchAdminUsers,
  toggleUserActiveApi,
  setUserRoleApi,
  fetchAdminStatsApi
} from '../api';
import { PageLoader } from './PageLoader';
import { ConfirmLogoutModal } from './ConfirmLogoutModal';
import { AddServiceModal } from './AddServiceModal';

type AdminTab = 'moderation' | 'all_services' | 'users' | 'stats';

interface AdminDashboardProps {
  userEmail: string | null;
  onLogout: () => void;
  onGoHome: () => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'Dorixona': 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=600&q=80',
  'Santexnika': 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80',
  'Elektrik': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
  'Go\'zallik': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
  'Tozalash': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
  'Ta\'lim': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
  'Avto': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80'
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userEmail, onLogout, onGoHome }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('moderation');
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Barchasi');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'customer' | 'provider'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvList, usrList, statsRes] = await Promise.all([
        fetchAdminServices(statusFilter === 'all' ? undefined : statusFilter, categoryFilter === 'Barchasi' ? undefined : categoryFilter, searchQuery),
        fetchAdminUsers(),
        fetchAdminStatsApi()
      ]);
      setServices(srvList);
      setUsers(usrList);
      setStats(statsRes);
    } catch (e) {
      console.warn(e);
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusChange = async (serviceId: number, newStatus: 'approved' | 'rejected') => {
    try {
      const updated = await updateServiceStatusApi(serviceId, newStatus);
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s));

      const msg = newStatus === 'approved'
        ? "Xizmat tasdiqlandi va mijozlar katalogiga chiqarildi!"
        : "Xizmat rad etildi.";

      toast.success(msg);
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 3000);

      // Update stats
      fetchAdminStatsApi().then(st => setStats(st));
    } catch (err) {
      console.error(err);
      toast.error("Amalni bajarib bo'lmadi");
    }
  };

  const handleDeleteService = async (serviceId: number, title: string) => {
    if (!window.confirm(`"${title}" xizmatini o'chirmoqchimisiz?`)) return;
    try {
      await deleteServiceApi(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
      toast.info("Xizmat o'chirildi.");
      setActionSuccess("🗑️ Xizmat o'chirildi.");
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (err) {
      console.error(err);
      toast.error("O'chirib bo'lmadi");
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      const newActive = await toggleUserActiveApi(userId);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newActive } : u));
      newActive ? toast.success("Foydalanuvchi faollashtirildi") : toast.warn("Foydalanuvchi bloklandi");
    } catch (err) {
      console.error(err);
      toast.error("Amalni bajarib bo'lmadi");
    }
  };

  const handleSetRole = async (userId: number, newRole: 'customer' | 'provider') => {
    try {
      const role = await setUserRoleApi(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      toast.success(newRole === 'provider' ? "Xizmat ko'rsatuvchi roli berildi" : "Mijoz roliga qaytarildi");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Rolni o'zgartirib bo'lmadi");
    }
  };

  const handleAddService = async (data: ServiceCreateData) => {
    const created = await adminCreateServiceApi(data);
    setServices(prev => [created, ...prev]);
    setActionSuccess("✅ Yangi xizmat qo'shildi va mijozlar katalogiga chiqarildi!");
    setTimeout(() => setActionSuccess(null), 3000);
    fetchAdminStatsApi().then(st => setStats(st));
  };

  const pendingCount = services.filter(s => s.status === 'pending').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f8fafc' }}>
      
      {/* ── SIDEBAR ── */}
      <div style={{
        width: '240px', background: '#1e293b', borderRight: '1px solid #334155',
        display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100
      }}>
        {/* Brand */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#047857', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(4,120,87,0.4)' }}>
              <ShieldCheck style={{ width: '22px', height: '22px', color: '#ffffff' }} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                Yaqin<span style={{ color: '#10b981' }}>Admin</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Moderatsiya Portali</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => { setActiveTab('moderation'); setStatusFilter('pending'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '12px', border: 'none',
              background: activeTab === 'moderation' ? '#047857' : 'transparent',
              color: activeTab === 'moderation' ? '#ffffff' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Clock style={{ width: '18px', height: '18px' }} />
            <span style={{ flex: 1 }}>Moderatsiya</span>
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '20px' }}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('all_services'); setStatusFilter('all'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '12px', border: 'none',
              background: activeTab === 'all_services' ? '#047857' : 'transparent',
              color: activeTab === 'all_services' ? '#ffffff' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Briefcase style={{ width: '18px', height: '18px' }} />
            <span>Barcha Xizmatlar</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '12px', border: 'none',
              background: activeTab === 'users' ? '#047857' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <Users style={{ width: '18px', height: '18px' }} />
            <span>Foydalanuvchilar</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', borderRadius: '12px', border: 'none',
              background: activeTab === 'stats' ? '#047857' : 'transparent',
              color: activeTab === 'stats' ? '#ffffff' : '#94a3b8',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left'
            }}
          >
            <BarChart3 style={{ width: '18px', height: '18px' }} />
            <span>Platforma Tahlili</span>
          </button>
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={onGoHome}
            style={{
              width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid #334155', borderRadius: '10px', color: '#cbd5e1',
              fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <ExternalLink style={{ width: '15px', height: '15px' }} />
            <span>Asosiy saytga o'tish</span>
          </button>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            style={{
              width: '100%', padding: '10px', background: '#fee2e2',
              border: 'none', borderRadius: '10px', color: '#ef4444',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <LogOut style={{ width: '15px', height: '15px' }} />
            <span>Chiqish</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ marginLeft: '240px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#0f172a' }}>

        {/* Top bar */}
        <header style={{
          height: '64px', background: '#1e293b', borderBottom: '1px solid #334155',
          padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {activeTab === 'moderation' && "Xizmatlar Moderatsiyasi (Kutilayotgan e'lonlar)"}
              {activeTab === 'all_services' && "Barcha E'lonlar Boshqaruvi"}
              {activeTab === 'users' && "Ro'yxatdan O'tgan Foydalanuvchilar"}
              {activeTab === 'stats' && "YaqinXizmat Platforma Statistikasi"}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: '#047857', border: '1px solid #10b981',
                borderRadius: '10px', color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <PlusCircle style={{ width: '14px', height: '14px' }} />
              <span>Yangi xizmat</span>
            </button>

            <button
              onClick={loadData}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', background: '#334155', border: '1px solid #475569',
                borderRadius: '10px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} />
              <span>Yangilash</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', padding: '6px 14px', borderRadius: '20px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Admin: {userEmail?.split('@')[0] || 'SuperAdmin'}</span>
            </div>
          </div>
        </header>

        {/* Success alert banner */}
        {actionSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981',
            color: '#34d399', padding: '14px 32px', fontWeight: 700, fontSize: '0.92rem',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <CheckCircle2 style={{ width: '20px', height: '20px' }} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Body content */}
        <div style={{ padding: '28px 32px', flex: 1 }}>

          {loading ? (
            <PageLoader text="Admin ma'lumotlari yuklanmoqda..." />
          ) : (
            <>
              {/* ── 1. MODERATION TAB ── */}
              {activeTab === 'moderation' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.92rem', margin: 0 }}>
                      Ushbu xizmatlar provayderlar tomonidan qo'shilgan va tekshiruvdan so'ng mijozlarga ko'rinadi:
                    </p>
                    <span style={{ background: '#f59e0b', color: '#0f172a', fontWeight: 800, fontSize: '0.85rem', padding: '4px 12px', borderRadius: '20px' }}>
                      {services.filter(s => s.status === 'pending').length} ta kutilmoqda
                    </span>
                  </div>

                  {services.filter(s => s.status === 'pending').length === 0 ? (
                    <div style={{ background: '#1e293b', border: '1px dashed #334155', borderRadius: '20px', padding: '60px 20px', textAlign: 'center' }}>
                      <CheckCircle2 style={{ width: '56px', height: '56px', color: '#10b981', margin: '0 auto 16px' }} />
                      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                        Hozirda kutilayotgan e'lonlar yo'q!
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.92rem' }}>
                        Barcha yangi xizmatlar ko'rib chiqilgan va tasdiqlangan.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {services.filter(s => s.status === 'pending').map(srv => {
                        const defaultImg = CATEGORY_IMAGES[srv.category] || "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=600&q=80";
                        const srvImg = srv.image_url || defaultImg;
                        return (
                          <div key={srv.id} style={{
                            background: '#1e293b', border: '1.5px solid #f59e0b', borderRadius: '20px',
                            padding: '20px', display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: '20px', alignItems: 'center'
                          }}>
                            {/* Image */}
                            <div style={{ width: '180px', height: '120px', borderRadius: '14px', overflow: 'hidden', background: '#0f172a' }}>
                              <img src={srvImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            {/* Info */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                <span style={{ background: '#f59e0b', color: '#0f172a', fontWeight: 800, fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px' }}>
                                  ⏳ KUTILMOQDA
                                </span>
                                <span style={{ background: '#334155', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', padding: '2px 10px', borderRadius: '12px' }}>
                                  {srv.category}
                                </span>
                              </div>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0' }}>
                                {srv.title}
                              </h3>
                              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                                {srv.description}
                              </p>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: '#cbd5e1', flexWrap: 'wrap' }}>
                                <span>👤 <strong>{srv.provider_name}</strong></span>
                                <span>📞 <a href={`tel:${srv.phone}`} style={{ color: '#10b981' }}>{srv.phone}</a></span>
                                <span>📍 {srv.location}</span>
                                <span>⏰ {srv.days}: {srv.time_from}–{srv.time_to}</span>
                                {srv.owner_email && <span>📧 {srv.owner_email}</span>}
                              </div>
                            </div>

                            {/* Moderation Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '150px' }}>
                              <button
                                onClick={() => handleStatusChange(srv.id, 'approved')}
                                style={{
                                  padding: '12px 16px', background: '#047857', color: '#ffffff',
                                  border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '0.9rem',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                  boxShadow: '0 4px 12px rgba(4,120,87,0.4)'
                                }}
                              >
                                <Check style={{ width: '18px', height: '18px' }} />
                                <span>Tasdiqlash</span>
                              </button>

                              <button
                                onClick={() => handleStatusChange(srv.id, 'rejected')}
                                style={{
                                  padding: '10px 16px', background: '#334155', color: '#f87171',
                                  border: '1px solid #ef4444', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                }}
                              >
                                <X style={{ width: '16px', height: '16px' }} />
                                <span>Rad etish</span>
                              </button>

                              <button
                                onClick={() => handleDeleteService(srv.id, srv.title)}
                                style={{
                                  padding: '8px 16px', background: 'transparent', color: '#94a3b8',
                                  border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                }}
                              >
                                <Trash2 style={{ width: '14px', height: '14px' }} />
                                <span>O'chirish</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── 2. ALL SERVICES TAB ── */}
              {activeTab === 'all_services' && (
                <div>
                  {/* Filters bar */}
                  <div style={{ background: '#1e293b', padding: '16px 20px', borderRadius: '16px', border: '1px solid #334155', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Status filter */}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'all', label: 'Barchasi' },
                        { id: 'approved', label: '✅ Tasdiqlangan' },
                        { id: 'pending', label: '⏳ Kutilmoqda' },
                        { id: 'rejected', label: '❌ Rad etilgan' }
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setStatusFilter(f.id as any)}
                          style={{
                            padding: '8px 14px', borderRadius: '10px', border: 'none',
                            background: statusFilter === f.id ? '#047857' : '#334155',
                            color: statusFilter === f.id ? '#ffffff' : '#cbd5e1',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '0 12px' }}>
                      <Search style={{ width: '16px', height: '16px', color: '#64748b' }} />
                      <input
                        placeholder="Nomi, usta, manzil bo'yicha qidiring..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px', color: '#fff', fontSize: '0.88rem', width: '100%' }}
                      />
                    </form>
                  </div>

                  {/* Services List Table / Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {services.map(srv => (
                      <div key={srv.id} style={{
                        background: '#1e293b', border: '1px solid #334155', borderRadius: '16px',
                        padding: '16px 20px', display: 'grid', gridTemplateColumns: '60px 1fr auto auto', gap: '16px', alignItems: 'center'
                      }}>
                        <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', background: '#0f172a' }}>
                          <img src={srv.image_url || CATEGORY_IMAGES[srv.category] || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>{srv.title}</span>
                            <span style={{
                              background: srv.status === 'approved' ? '#065f46' : srv.status === 'rejected' ? '#7f1d1d' : '#78350f',
                              color: srv.status === 'approved' ? '#34d399' : srv.status === 'rejected' ? '#f87171' : '#fbbf24',
                              fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px'
                            }}>
                              {srv.status === 'approved' ? '✅ Tasdiqlangan' : srv.status === 'rejected' ? '❌ Rad etilgan' : '⏳ Kutilmoqda'}
                            </span>
                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>• {srv.category}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                            Usta: <strong>{srv.provider_name}</strong> ({srv.phone}) • {srv.location} • Ko'rishlar: {srv.views_count || 0}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {srv.status !== 'approved' && (
                            <button
                              onClick={() => handleStatusChange(srv.id, 'approved')}
                              style={{ padding: '8px 12px', background: '#047857', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Tasdiqlash
                            </button>
                          )}
                          {srv.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(srv.id, 'rejected')}
                              style={{ padding: '8px 12px', background: '#334155', color: '#f87171', border: '1px solid #ef4444', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                              Rad etish
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteService(srv.id, srv.title)}
                            style={{ padding: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                            title="O'chirish"
                          >
                            <Trash2 style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 3. USERS TAB ── */}
              {activeTab === 'users' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {([
                        { id: 'all', label: `Barchasi (${users.length})` },
                        { id: 'customer', label: `Mijozlar (${users.filter(u => u.role === 'customer').length})` },
                        { id: 'provider', label: `Xizmat ko'rsatuvchilar (${users.filter(u => u.role === 'provider').length})` },
                      ] as const).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setUserRoleFilter(f.id)}
                          style={{
                            padding: '8px 18px', borderRadius: '24px', border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.85rem',
                            background: userRoleFilter === f.id ? '#047857' : '#1e293b',
                            color: userRoleFilter === f.id ? '#ffffff' : '#94a3b8',
                            boxShadow: userRoleFilter === f.id ? '0 4px 14px rgba(4,120,87,0.35)' : 'none'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <span style={{ background: '#334155', color: '#10b981', fontWeight: 800, fontSize: '0.85rem', padding: '4px 14px', borderRadius: '20px' }}>
                      Ko'rsatilmoqda: {users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter).length} ta
                    </span>
                  </div>

                  <div style={{ background: '#1e293b', borderRadius: '20px', border: '1px solid #334155', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '0.82rem' }}>
                          <th style={{ padding: '14px 20px' }}>ID</th>
                          <th style={{ padding: '14px 20px' }}>Foydalanuvchi</th>
                          <th style={{ padding: '14px 20px' }}>Email / Telefon</th>
                          <th style={{ padding: '14px 20px' }}>Roli</th>
                          <th style={{ padding: '14px 20px' }}>Holati</th>
                          <th style={{ padding: '14px 20px', textAlign: 'right' }}>Amallar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.filter(u => userRoleFilter === 'all' || u.role === userRoleFilter).map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid #334155' }}>
                            <td style={{ padding: '14px 20px', color: '#64748b' }}>#{u.id}</td>
                            <td style={{ padding: '14px 20px' }}>
                              <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.full_name || 'Noma\'lum'}</div>
                              {u.business_name && <div style={{ fontSize: '0.78rem', color: '#10b981' }}>{u.business_name}</div>}
                            </td>
                            <td style={{ padding: '14px 20px', color: '#cbd5e1' }}>
                              <div>{u.email}</div>
                              {u.phone && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.phone}</div>}
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{
                                background: u.role === 'provider' ? '#065f46' : (u.role === 'admin' ? '#4c1d95' : '#1e3a8a'),
                                color: u.role === 'provider' ? '#34d399' : (u.role === 'admin' ? '#c4b5fd' : '#93c5fd'),
                                fontSize: '0.78rem', fontWeight: 800, padding: '3px 10px', borderRadius: '12px'
                              }}>
                                {u.role === 'provider' ? 'Xizmat ko\'rsatuvchi' : (u.role === 'admin' ? 'Admin' : 'Mijoz')}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px' }}>
                              <span style={{ color: u.is_active ? '#34d399' : '#f87171', fontWeight: 700, fontSize: '0.85rem' }}>
                                {u.is_active ? '● Faol' : '● Bloklangan'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                              {u.role !== 'admin' && (
                                <button
                                  onClick={() => handleSetRole(u.id, u.role === 'provider' ? 'customer' : 'provider')}
                                  style={{
                                    padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155',
                                    background: '#0f172a', color: '#38bdf8',
                                    fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginRight: '8px'
                                  }}
                                >
                                  {u.role === 'provider' ? 'Mijozga o\'tkazish' : 'Ustaga o\'tkazish'}
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleUser(u.id)}
                                style={{
                                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                                  background: u.is_active ? '#fee2e2' : '#ecfdf5',
                                  color: u.is_active ? '#ef4444' : '#047857',
                                  fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer'
                                }}
                              >
                                {u.is_active ? 'Bloklash' : 'Faollashtirish'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── 4. STATS TAB ── */}
              {activeTab === 'stats' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '22px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Jami Foydalanuvchilar</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>{stats?.total_users || users.length}</div>
                      <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '6px' }}>
                        {stats?.total_providers || 0} provayder, {stats?.total_customers || 0} mijoz
                      </div>
                    </div>

                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '22px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Jami Xizmatlar</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>{stats?.total_services || services.length}</div>
                      <div style={{ fontSize: '0.8rem', color: '#34d399', marginTop: '6px' }}>
                        {stats?.approved_services || 0} tasdiqlangan
                      </div>
                    </div>

                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '22px', border: '1px solid #f59e0b' }}>
                      <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '8px' }}>Kutilayotgan Moderatsiya</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{stats?.pending_services || pendingCount}</div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '6px' }}>
                        Tasdiq kutilmoqda
                      </div>
                    </div>

                    <div style={{ background: '#1e293b', borderRadius: '18px', padding: '22px', border: '1px solid #334155' }}>
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '8px' }}>Jami Ko'rishlar</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>{(stats?.total_views || 3550).toLocaleString()}</div>
                      <div style={{ fontSize: '0.8rem', color: '#38bdf8', marginTop: '6px' }}>
                        {(stats?.total_calls || 270).toLocaleString()} qo'ng'iroq
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#1e293b', borderRadius: '20px', padding: '28px', border: '1px solid #334155' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px' }}>
                      Platforma Moderatsiya Qoidalari
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '14px' }}>
                        <strong style={{ color: '#10b981' }}>✅ Qabul qilinadigan e'lonlar:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          <li>To'liq manzili va telefon raqami ko'rsatilgan xizmatlar</li>
                          <li>Haqiqiy va sifatli rasmlarga ega e'lonlar</li>
                          <li>Buxoro shahri va viloyatiga tegishli faoliyatlar</li>
                        </ul>
                      </div>
                      <div style={{ background: '#0f172a', padding: '16px', borderRadius: '14px' }}>
                        <strong style={{ color: '#ef4444' }}>❌ Rad etiladigan holatlar:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          <li>Noto'g'ri yoki ishlamaydigan telefon raqamlar</li>
                          <li>Taqiqlangan yoki noqonuniy faoliyat turlari</li>
                          <li>Spam yoki qayta takrorlangan e'lonlar</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Logout modal */}
      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          onLogout();
        }}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

      {/* Add service modal */}
      <AddServiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddService}
      />
    </div>
  );
};
