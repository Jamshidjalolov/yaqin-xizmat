import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RoleSelectionScreen } from './components/RoleSelectionScreen';
import { AuthMethodScreen } from './components/AuthMethodScreen';
import { RegisterStepForm } from './components/RegisterStepForm';
import { SuccessCompleteScreen } from './components/SuccessCompleteScreen';
import { ProviderDashboard } from './components/ProviderDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CategoryFilter } from './components/CategoryFilter';
import { ServiceCard } from './components/ServiceCard';
import { MapView } from './components/MapView';
import { ServiceModal } from './components/ServiceModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { PageLoader } from './components/PageLoader';
import {
  Service,
  fetchServices,
  fetchServiceById,
  completeProfileApi,
  loginUser,
  loginWithTelegram,
  checkUserApi,
  isSessionStale,
  trackServiceDirectionApi,
  SESSION_EXPIRED_EVENT
} from './api';
import { Language } from './i18n';
import { LatLng, distanceMeters, BUKHARA_CENTER } from './utils/geo';
import { parseDeepLink } from './utils/deepLink';
import RouteModal from './components/RouteModal';
import { RefreshCw, SearchX, AlertCircle, Map as MapIcon, LayoutGrid, Crosshair } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const App: React.FC = () => {
  const initialDeepLink = useMemo(() => parseDeepLink(), []);
  const hasDeepLink = useMemo(() => (
    initialDeepLink.serviceId !== null ||
    Boolean(initialDeepLink.category) ||
    Boolean(initialDeepLink.search) ||
    initialDeepLink.tab !== null
  ), [initialDeepLink]);

  const [currentScreen, setCurrentScreen] = useState<
    'welcome' | 'role_select' | 'auth_method' | 'register_form' | 'success_complete' | 'admin_login' | 'main'
  >(() => {
    const isTelegram = Boolean(window.Telegram?.WebApp?.initData);
    if (
      isTelegram ||
      initialDeepLink.serviceId !== null ||
      Boolean(initialDeepLink.category) ||
      Boolean(initialDeepLink.search) ||
      initialDeepLink.tab !== null
    ) {
      return 'main';
    }
    if (!localStorage.getItem('user_email')) return 'welcome';
    if (localStorage.getItem('user_role') === 'admin' && isSessionStale('admin')) return 'admin_login';
    return 'main';
  });

  const [lang, setLang] = useState<Language>('UZ');
  
  // Selected Role State: 'customer' | 'provider' | 'admin'
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider' | 'admin'>(() => {
    const saved = localStorage.getItem('user_role');
    return (saved === 'provider' || saved === 'customer' || saved === 'admin') ? saved : 'customer';
  });

  const [authUserData, setAuthUserData] = useState<{
    email: string;
    displayName: string;
    photoURL: string;
    phone?: string;
  }>(() => {
    const savedEmail = localStorage.getItem('user_email') || '';
    return {
      email: savedEmail,
      displayName: localStorage.getItem('user_display_name') || (savedEmail ? savedEmail.split('@')[0] : ''),
      photoURL: ''
    };
  });

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return initialDeepLink.category || 'Barchasi';
  });
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    return initialDeepLink.search || '';
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(() => {
    return initialDeepLink.serviceId;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const [viewMode, setViewMode] = useState<'grid' | 'map'>(() => {
    return initialDeepLink.view === 'map' ? 'map' : 'grid';
  });
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [locating, setLocating] = useState(false);
  const [routeTarget, setRouteTarget] = useState<{ dest: LatLng; name: string } | null>(null);

  const [userEmail, setUserEmail] = useState<string | null>(() => {
    return localStorage.getItem('user_email');
  });

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();
    if (!webApp.initData || (localStorage.getItem('user_email') && !isSessionStale())) return;

    let active = true;
    loginWithTelegram(webApp.initData)
      .then(({ user }) => {
        if (!active) return;
        const email = user.email as string;
        const name = (user.full_name as string | undefined) || email.split('@')[0];
        const role = (user.role as 'customer' | 'provider' | 'admin') || 'customer';
        localStorage.setItem('user_email', email);
        localStorage.setItem('user_role', role);
        localStorage.setItem('user_display_name', name);
        setUserEmail(email);
        setSelectedRole(role);
        setAuthUserData({ email, displayName: name, photoURL: user.avatar_url || '' });
        setCurrentScreen('main');
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error('Telegram Web App login failed:', err);
        setCurrentScreen('main');
        let detail: string | undefined;
        if (axios.isAxiosError(err)) {
          const respDetail = err.response?.data?.detail;
          if (typeof respDetail === 'string') {
            detail = respDetail;
          } else if (Array.isArray(respDetail) && respDetail.length > 0 && typeof respDetail[0]?.msg === 'string') {
            detail = respDetail[0].msg;
          } else if (err.code === 'ERR_NETWORK' || !err.response) {
            detail = "Serverga ulanib bo'lmadi. Internet yoki backend server holatini tekshiring.";
          }
        } else if (err instanceof Error) {
          detail = err.message;
        }
        window.setTimeout(() => toast.error(detail || 'Telegram orqali kirib bo\'lmadi. Keyinroq qayta urinib ko\'ring.'), 0);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (currentScreen !== 'main' || linkedServiceId === null) return;

    let active = true;
    fetchServiceById(linkedServiceId)
      .then((service) => {
        if (!active) return;
        if (!service || service.status !== 'approved') {
          toast.error("Ushbu xizmat hozir ilovada mavjud emas.");
          setLinkedServiceId(null);
          return;
        }

        if (initialDeepLink.view === 'map') {
          setViewMode('map');
        } else {
          setViewMode('grid');
        }
        setSelectedService(service);
        setLinkedServiceId(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Linked Telegram service could not be opened:', error);
        toast.error("Xizmatni ilovada ochib bo'lmadi. Qayta urinib ko'ring.");
        setLinkedServiceId(null);
      });

    return () => {
      active = false;
    };
  }, [currentScreen, linkedServiceId, initialDeepLink.view]);

  // Load ALL services for customer view
  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchServices(selectedCategory, searchQuery);
      setServices(data);
    } catch (err: any) {
      console.error(err);
      setError('Serverga ulanishda xatolik yuz berdi.');
    } finally {
      setTimeout(() => setLoading(false), 200);
    }
  };

  useEffect(() => {
    if (currentScreen === 'main') {
      loadServices();
    }
  }, [currentScreen, selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadServices();
  };

  const requestLocation = () => {
    if (!navigator.geolocation) { toast.error('Brauzeringiz joylashuvni qo\'llab-quvvatlamaydi.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
        toast.success('Joylashuvingiz aniqlandi — eng yaqin xizmatlar tepaga chiqarildi.');
      },
      () => { setLocating(false); toast.error('Joylashuvni aniqlab bo\'lmadi. Ruxsat bering yoki qo\'lda kiriting.'); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const openDirections = (lat: string | number | undefined, lng: string | number | undefined, name: string, serviceId?: number) => {
    const latN = parseFloat(String(lat));
    const lngN = parseFloat(String(lng));
    const dest = Number.isNaN(latN) || Number.isNaN(lngN) ? BUKHARA_CENTER : { lat: latN, lng: lngN };
    if (serviceId) trackServiceDirectionApi(serviceId);
    setRouteTarget({ dest, name });
  };

  const distanceById = useMemo(() => {
    const m: Record<number, number> = {};
    if (userPos) services.forEach(s => {
      const lat = parseFloat(String(s.lat)); const lng = parseFloat(String(s.lng));
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) m[s.id] = distanceMeters(userPos, lat, lng);
    });
    return m;
  }, [services, userPos]);

  const rankedServices = useMemo(() => {
    if (!userPos) return services;
    return [...services].sort((a, b) => (distanceById[a.id] ?? Infinity) - (distanceById[b.id] ?? Infinity));
  }, [services, userPos, distanceById]);

  const handleAuthSuccess = (email: string, roleToSave?: 'customer' | 'provider' | 'admin') => {
    setUserEmail(email);
    localStorage.setItem('user_email', email);
    if (roleToSave) {
      setSelectedRole(roleToSave);
      localStorage.setItem('user_role', roleToSave);
    }
  };

  const clearSession = () => {
    setUserEmail(null);
    setAuthUserData({ email: '', displayName: '', photoURL: '' });
    localStorage.removeItem('user_email');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_display_name');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentScreen('welcome');
  };

  useEffect(() => {
    const onSessionExpired = () => {
      const wasAdmin = localStorage.getItem('user_role') === 'admin';
      clearSession();
      setCurrentScreen(wasAdmin ? 'admin_login' : 'welcome');
      toast.info('Sessiya muddati tugagan. Davom etish uchun qaytadan kiring.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('user_role') !== 'admin') return;
    if (!localStorage.getItem('user_email')) return;
    if (!isSessionStale('admin')) return;
    clearSession();
    setCurrentScreen('admin_login');
    toast.info('Admin sessiyasining muddati tugagan. Qaytadan kiring.');
  }, []);

  // Google / Phone Auth orqali kirganda
  const handleAuthUserReady = async (userData: { email: string; displayName: string; photoURL: string; phone?: string }) => {
    setAuthUserData(userData);
    const activeRole = selectedRole;

    try {
      const check = await checkUserApi(userData.email);
      if (check.exists && check.user) {
        await loginUser(userData.email, '');
        const dbRole: 'customer' | 'provider' = check.user.role === 'provider' ? 'provider' : 'customer';
        if (activeRole === 'provider' && dbRole === 'customer') {
          toast.info('Ustalik rolini sayt administratori faollashtiradi. Hozircha mijoz sifatida kirdingiz.');
        }
        handleAuthSuccess(userData.email, dbRole);
        const resolvedName = check.user?.full_name || userData.displayName;
        setAuthUserData(prev => ({
          ...prev,
          displayName: resolvedName,
          phone: check.user?.phone || prev.phone,
          photoURL: check.user?.avatar_url || prev.photoURL
        }));
        if (resolvedName) localStorage.setItem('user_display_name', resolvedName);
        setCurrentScreen('main');
        return;
      }
      // Yangi foydalanuvchi -> profilni to'ldirish formasi
      setCurrentScreen('register_form');
    } catch (err: any) {
      console.warn('Auth check error:', err);
      const detail = err?.response?.data?.detail;
      toast.error(detail || "Server bilan bog'lanishda xatolik. Qayta urinib ko'ring.");
    }
  };

  // ── 1. Welcome ──────────────────────────────────────────────────────────────
  if (currentScreen === 'welcome') {
    return (
      <div className="page-transition">
        <WelcomeScreen
          lang={lang}
          onLangChange={setLang}
          onLoginClick={() => setCurrentScreen('role_select')}
          onRegisterClick={() => setCurrentScreen('role_select')}
        />
      </div>
    );
  }

  // ── 2. Role Selection ────────────────────────────────────────────────────────
  if (currentScreen === 'role_select') {
    return (
      <div className="page-transition-right">
        <RoleSelectionScreen
          lang={lang}
          onBack={() => setCurrentScreen('welcome')}
          onSkip={() => {
            setSelectedRole('customer');
            setCurrentScreen('main');
          }}
          onSelectRole={(role) => {
            setSelectedRole(role);
            localStorage.setItem('user_role', role);
            if (role === 'admin') {
              setCurrentScreen('admin_login');
            } else {
              setCurrentScreen('auth_method');
            }
          }}
        />
      </div>
    );
  }

  // ── 3. Auth Method (Google / Phone) ─────────────────────────────────────────
  if (currentScreen === 'auth_method') {
    return (
      <div className="page-transition-right">
        <AuthMethodScreen
          lang={lang}
          role={selectedRole === 'admin' ? 'customer' : selectedRole}
          onBack={() => setCurrentScreen('role_select')}
          onGoogleAuth={async (gUser) => {
            await handleAuthUserReady(gUser);
          }}
          onPhoneSubmit={async (phoneNum) => {
            const genEmail = `user_${phoneNum.replace(/\D/g, '')}@yaqinxizmat.uz`;
            await handleAuthUserReady({
              email: genEmail,
              displayName: 'Foydalanuvchi',
              photoURL: '',
              phone: phoneNum
            });
          }}
          onEmailLoginSuccess={(email, displayName, role) => {
            const name = displayName || email.split('@')[0];
            setUserEmail(email);
            localStorage.setItem('user_email', email);
            setSelectedRole(role);
            localStorage.setItem('user_role', role);
            localStorage.setItem('user_display_name', name);
            setAuthUserData({ email, displayName: name, photoURL: '' });
            setCurrentScreen('main');
          }}
        />
      </div>
    );
  }

  // ── 4. Register Form (Only for new users) ──────────────────────────────────
  if (currentScreen === 'register_form') {
    return (
      <div className="page-transition-right">
        <RegisterStepForm
          lang={lang}
          role={selectedRole === 'admin' ? 'customer' : selectedRole}
          initialData={authUserData}
          onBack={() => setCurrentScreen('auth_method')}
          onSubmitProfile={async (profileData) => {
            const emailToSave = authUserData.email || `user_${Date.now()}@yaqinxizmat.uz`;
            await completeProfileApi({
              email: emailToSave,
              fullName: profileData.fullName,
              phone: profileData.phone,
              city: profileData.city,
              activityType: profileData.activityType,
              businessName: profileData.businessName,
              avatarUrl: profileData.avatarUrl,
              role: 'customer'
            });
            handleAuthSuccess(emailToSave, 'customer');
            setAuthUserData(prev => ({
              ...prev,
              displayName: profileData.fullName,
              phone: profileData.phone,
              photoURL: profileData.avatarUrl || prev.photoURL
            }));
            if (profileData.fullName) localStorage.setItem('user_display_name', profileData.fullName);
            if (selectedRole === 'provider') {
              toast.info('Ustalik rolini sayt administratori tasdiqlagandan so\'ng faollashtiriladi.');
            }
            setCurrentScreen('success_complete');
          }}
        />
      </div>
    );
  }

  // ── 5. Success Complete ──────────────────────────────────────────────────────
  if (currentScreen === 'success_complete') {
    return (
      <div className="page-transition-scale">
        <SuccessCompleteScreen
          lang={lang}
          onStart={() => setCurrentScreen('main')}
        />
      </div>
    );
  }

  // ── 5b. Admin Login (parol bilan himoyalangan kirish) ────────────────────────
  if (currentScreen === 'admin_login') {
    return (
      <div className="page-transition-right">
        <AdminLoginScreen
          onBack={() => setCurrentScreen('role_select')}
          onSuccess={(email) => {
            setUserEmail(email);
            localStorage.setItem('user_email', email);
            setSelectedRole('admin');
            localStorage.setItem('user_role', 'admin');
            setCurrentScreen('main');
          }}
        />
      </div>
    );
  }

  // ── 6a. ADMIN DASHBOARD (Barcha ma'lumotlar va moderatsiya) ───────────────────
  if (currentScreen === 'main' && selectedRole === 'admin' && !hasDeepLink) {
    return (
      <div className="page-transition">
        <AdminDashboard
          userEmail={userEmail || 'admin@yaqinxizmat.uz'}
          onLogout={handleLogout}
          onGoHome={() => {
            setSelectedRole('customer');
            localStorage.setItem('user_role', 'customer');
          }}
        />
      </div>
    );
  }

  // ── 6b. PROVIDER DASHBOARD (Faqat Xizmat ko'rsatuvchi uchun) ─────────────────
  if (currentScreen === 'main' && selectedRole === 'provider' && !hasDeepLink) {
    return (
      <div className="page-transition">
        <ProviderDashboard
          userEmail={userEmail}
          authUserData={authUserData}
          onLogout={handleLogout}
          onSwitchToCustomer={() => {
            setSelectedRole('customer');
            localStorage.setItem('user_role', 'customer');
          }}
        />
      </div>
    );
  }

  // ── 6b. CUSTOMER MARKETPLACE (Mijozlar uchun toza katalog) ──────────────────
  return (
    <div className="page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        lang={lang}
        onLangChange={setLang}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        userEmail={userEmail}
        selectedRole={selectedRole}
        onLogout={handleLogout}
        onGoHome={() => setCurrentScreen('welcome')}
      />

      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 20px' }}>
        <Hero
          lang={lang}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
        />

        <CategoryFilter
          lang={lang}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* View toolbar: grid / map / location */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '6px 0 18px', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(30,41,59,0.6)', border: '1px solid var(--border-color)', borderRadius: '9999px', padding: '4px' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.86rem', background: viewMode === 'grid' ? 'var(--primary)' : 'transparent', color: viewMode === 'grid' ? '#04121c' : '#94a3b8', transition: 'all 0.2s' }}
            >
              <LayoutGrid style={{ width: '16px', height: '16px' }} /> Ro'yxat
            </button>
            <button
              onClick={() => setViewMode('map')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', borderRadius: '9999px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.86rem', background: viewMode === 'map' ? 'var(--primary)' : 'transparent', color: viewMode === 'map' ? '#04121c' : '#94a3b8', transition: 'all 0.2s' }}
            >
              <MapIcon style={{ width: '16px', height: '16px' }} /> Xarita
            </button>
          </div>

          <button
            onClick={requestLocation}
            disabled={locating}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '9px 18px', fontSize: '0.86rem', opacity: locating ? 0.6 : 1 }}
          >
            <Crosshair style={{ width: '16px', height: '16px', color: userPos ? '#10b981' : '#38bdf8' }} />
            {locating ? 'Aniqlanmoqda...' : userPos ? 'Eng yaqin xizmatlar' : 'Joylashuvimni aniqlash'}
          </button>
        </div>

        {/* Loading / Error / Empty / Services */}
        {loading ? (
          <PageLoader text="Buxorodagi barcha xizmatlar yuklanmoqda..." />
        ) : error ? (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '16px', padding: '32px', textAlign: 'center', margin: '20px 0' }}>
            <AlertCircle style={{ width: '40px', height: '40px', color: '#ef4444', margin: '0 auto 12px auto' }} />
            <h3 style={{ color: '#f87171', fontSize: '1.2rem', marginBottom: '8px' }}>Ma'lumotlarni yuklab bo'lmadi</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '16px' }}>{error}</p>
            <button onClick={loadServices} className="btn-secondary">Qayta Urinib Ko'rish</button>
          </div>
        ) : services.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(30,41,59,0.4)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <SearchX style={{ width: '48px', height: '48px', color: '#64748b', margin: '0 auto 16px auto' }} />
            <h3 style={{ fontSize: '1.2rem', color: '#e2e8f0', marginBottom: '8px' }}>Xizmatlar Topilmadi</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Ushbu kategoriya bo'yicha hozircha e'lonlar mavjud emas.
            </p>
          </div>
        ) : viewMode === 'map' ? (
          <div style={{ height: '70vh', minHeight: 460, borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
            <MapView services={services} userPos={userPos} onSelect={(s) => setSelectedService(s)} onDirections={(s) => openDirections(s.lat, s.lng, s.title, s.id)} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {rankedServices.map((service, idx) => (
              <ServiceCard
                key={service.id}
                lang={lang}
                service={service}
                distanceMeters={distanceById[service.id]}
                rank={idx}
                onSelect={(s) => setSelectedService(s)}
                onDirections={(s) => openDirections(s.lat, s.lng, s.title, s.id)}
              />
            ))}
          </div>
        )}
      </main>

      <Footer lang={lang} />

      <ServiceModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        userEmail={userEmail}
        userName={authUserData.displayName}
        onRequireLogin={() => setCurrentScreen('role_select')}
        userPos={userPos}
        onLocate={requestLocation}
        onOpenDirections={(dest, name) => openDirections(dest.lat, dest.lng, name, selectedService?.id)}
        onServiceUpdated={(updated) => {
          setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
          setSelectedService(updated);
        }}
      />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onSuccess={handleAuthSuccess} />
      {routeTarget && (
        <RouteModal
          dest={routeTarget.dest}
          destName={routeTarget.name}
          origin={userPos}
          onLocate={requestLocation}
          onClose={() => setRouteTarget(null)}
        />
      )}
      <ToastContainer position="top-center" autoClose={2600} newestOnTop={false} theme="light" />
    </div>
  );
};

export default App;
