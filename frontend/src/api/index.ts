import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:8000' : 'https://yaqin-xizmat-api.onrender.com');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const SESSION_EXPIRED_EVENT = 'yx:session-expired';

// true = token yo'q, buzilgan, muddati o'tgan yoki boshqa rolga tegishli
export const isSessionStale = (requiredRole?: string): boolean => {
  const token = localStorage.getItem('access_token');
  if (!token) return true;
  const parts = token.split('.');
  if (parts.length !== 3) return true;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) return true;
    if (requiredRole && payload.role !== requiredRole) return true;
    return false;
  } catch {
    return true;
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && localStorage.getItem('access_token')) {
      localStorage.removeItem('access_token');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

export interface Service {
  id: number;
  title: string;
  category: string;
  description: string;
  price?: number;
  location: string;
  phone: string;
  provider_name: string;
  rating: number;
  image_url?: string;
  days?: string;
  time_from?: string;
  time_to?: string;
  lat?: string;
  lng?: string;
  gallery?: string;
  status?: string; // 'pending' | 'approved' | 'rejected'
  views_count?: number;
  phone_clicks?: number;
  directions_count?: number;
  rating_count?: number;
  owner_id?: number;
  owner_email?: string;
  created_at?: string;
}

export interface Review {
  id: number;
  service_id: number;
  user_email: string;
  user_name?: string;
  rating: number;
  comment?: string;
  created_at?: string;
}

export interface ReviewCreateData {
  service_id: number;
  user_email: string;
  user_name?: string;
  rating: number;
  comment?: string;
}

export interface Message {
  id: number;
  service_id?: number;
  sender_email: string;
  sender_name?: string;
  recipient_email: string;
  body: string;
  is_read: boolean;
  created_at?: string;
}

export interface MessageCreateData {
  service_id?: number;
  sender_email: string;
  sender_name?: string;
  recipient_email: string;
  body: string;
}

export interface ProfileUpdateData {
  email: string;
  full_name?: string;
  phone?: string;
  city?: string;
  business_name?: string;
  activity_type?: string;
  avatar_url?: string;
}

export interface ServiceCreateData {
  title: string;
  category: string;
  description: string;
  price?: number;
  location: string;
  phone: string;
  provider_name: string;
  image_url?: string;
  days?: string;
  time_from?: string;
  time_to?: string;
  lat?: string;
  lng?: string;
  gallery?: string;
  status?: string;
  owner_email?: string;
}

export interface ProfileCompleteData {
  email: string;
  fullName: string;
  phone: string;
  city?: string;
  businessName?: string;
  activityType?: string;
  avatarUrl?: string;
  role: 'customer' | 'provider';
}

export interface UserData {
  id: number;
  email: string;
  full_name?: string;
  phone?: string;
  city?: string;
  business_name?: string;
  activity_type?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface ProviderStats {
  total_services: number;
  total_views: number;
  total_calls: number;
  total_directions: number;
  views_growth: string;
  calls_growth: string;
  directions_growth: string;
  avg_rating: number;
  rating_count: number;
  weekly_breakdown: Array<{ day: string; views: number; calls: number }>;
  top_services: Service[];
}

export interface AdminStats {
  total_users: number;
  total_customers: number;
  total_providers: number;
  total_services: number;
  pending_services: number;
  approved_services: number;
  rejected_services: number;
  total_views: number;
  total_calls: number;
}

export const fetchServices = async (category?: string, search?: string, ownerEmail?: string): Promise<Service[]> => {
  const params: Record<string, string> = {};
  if (category && category !== 'Barchasi') params.category = category;
  if (search) params.search = search;
  if (ownerEmail) params.owner_email = ownerEmail;

  const response = await api.get('/services', { params });
  return response.data;
};

export const uploadImageApi = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post('/uploads/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data.url;
};

export const fetchServiceById = async (id: number): Promise<Service | null> => {
  try {
    const response = await api.get(`/services/${id}`);
    return response.data;
  } catch (error) {
    console.warn('Backend fetch service detail error:', error);
    return null;
  }
};

export const createServiceApi = async (data: ServiceCreateData): Promise<Service> => {
  try {
    const response = await api.post('/services', data);
    return response.data;
  } catch (error) {
    console.warn("Backend create service notice:", error);
    const mockService: Service = {
      id: Date.now(),
      ...data,
      rating: 5.0,
      status: 'pending'
    };
    return mockService;
  }
};

export const updateServiceApi = async (id: number, data: Partial<ServiceCreateData>): Promise<Service> => {
  const response = await api.put(`/services/${id}`, data);
  return response.data;
};

export const deleteServiceApi = async (id: number): Promise<void> => {
  await api.delete(`/services/${id}`);
};

export const trackServiceViewApi = async (id: number): Promise<void> => {
  try {
    await api.post(`/services/${id}/view`);
  } catch {}
};

export const trackServiceCallApi = async (id: number): Promise<void> => {
  try {
    await api.post(`/services/${id}/call`);
  } catch {}
};

export const fetchProviderStatsApi = async (ownerEmail?: string): Promise<ProviderStats> => {
  const params: Record<string, string> = {};
  if (ownerEmail) params.owner_email = ownerEmail;
  const response = await api.get('/stats/provider', { params });
  return response.data;
};

// ── REVIEWS (REYTING) ──

export const fetchReviewsApi = async (serviceId: number): Promise<Review[]> => {
  try {
    const response = await api.get(`/services/${serviceId}/reviews`);
    return response.data;
  } catch (error) {
    console.warn('Fetch reviews error:', error);
    return [];
  }
};

export const createReviewApi = async (serviceId: number, data: ReviewCreateData): Promise<Review> => {
  const response = await api.post(`/services/${serviceId}/reviews`, data);
  return response.data;
};

// ── MESSAGES (XABARLAR) ──

export const fetchMessagesApi = async (email: string): Promise<Message[]> => {
  try {
    const response = await api.get('/messages', { params: { email } });
    return response.data;
  } catch (error) {
    console.warn('Fetch messages error:', error);
    return [];
  }
};

export interface MessageThread {
  peer_email: string;
  peer_name?: string;
  service_id?: number;
  service_title?: string;
  service_image?: string;
  last_body: string;
  last_sender: 'me' | 'peer';
  last_at?: string;
  unread: number;
}

export const fetchMessageThreadsApi = async (email: string): Promise<MessageThread[]> => {
  const response = await api.get('/messages/threads', { params: { email } });
  return response.data;
};

export const fetchThreadApi = async (email: string, peerEmail: string, serviceId?: number): Promise<Message[]> => {
  const params: Record<string, string | number> = { email, peer_email: peerEmail };
  if (serviceId !== undefined && serviceId !== null) params.service_id = serviceId;
  const response = await api.get('/messages/thread', { params });
  return response.data;
};

export const markThreadReadApi = async (email: string, peerEmail: string, serviceId?: number): Promise<void> => {
  const params: Record<string, string | number> = { email, peer_email: peerEmail };
  if (serviceId !== undefined && serviceId !== null) params.service_id = serviceId;
  await api.put('/messages/read-thread', null, { params });
};

export const fetchUnreadCountApi = async (email: string): Promise<number> => {
  try {
    const response = await api.get('/messages/unread-count', { params: { email } });
    return response.data.unread || 0;
  } catch {
    return 0;
  }
};

export const sendMessageApi = async (data: MessageCreateData): Promise<Message> => {
  const response = await api.post('/messages', data);
  return response.data;
};

export const markMessageReadApi = async (messageId: number): Promise<Message> => {
  const response = await api.put(`/messages/${messageId}/read`);
  return response.data;
};

// ── DIRECTION TRACKING ──

export const trackServiceDirectionApi = async (id: number): Promise<void> => {
  try {
    await api.post(`/services/${id}/direction`);
  } catch {}
};

// ── PROFILE ──

export const fetchUserProfileApi = async (email: string): Promise<UserData | null> => {
  try {
    const response = await api.get(`/auth/user/${encodeURIComponent(email)}`);
    return response.data;
  } catch (error) {
    console.warn('Fetch profile error:', error);
    return null;
  }
};

export const updateProfileApi = async (data: ProfileUpdateData): Promise<UserData> => {
  const response = await api.put('/auth/profile', data);
  return response.data;
};

// ── STRICT AUTH (xatoliklarni yutmaydi) ──

export const loginUserStrict = async (email: string, password: string): Promise<any> => {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data;
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  return data;
};

export const registerUserStrict = async (
  email: string,
  password: string,
  fullName: string,
  phone?: string,
  role: 'customer' | 'provider' = 'customer'
): Promise<any> => {
  const response = await api.post('/auth/register', {
    email, password, full_name: fullName, phone, role
  });
  return response.data;
};

// ── ADMIN API ──

export const fetchAdminServices = async (status?: string, category?: string, search?: string): Promise<Service[]> => {
  try {
    const params: Record<string, string> = {};
    if (status && status !== 'all') params.status = status;
    if (category && category !== 'Barchasi') params.category = category;
    if (search) params.search = search;
    const response = await api.get('/admin/services', { params });
    return response.data;
  } catch (error) {
    console.warn('Admin fetch services error:', error);
    return [];
  }
};

export const updateServiceStatusApi = async (serviceId: number, status: 'approved' | 'rejected' | 'pending'): Promise<Service> => {
  const response = await api.put(`/admin/services/${serviceId}/status`, { status });
  return response.data;
};

export const adminCreateServiceApi = async (data: ServiceCreateData): Promise<Service> => {
  const response = await api.post('/admin/services', data);
  return response.data;
};

export const fetchAdminUsers = async (role?: string): Promise<UserData[]> => {
  try {
    const params: Record<string, string> = {};
    if (role && role !== 'all') params.role = role;
    const response = await api.get('/admin/users', { params });
    return response.data;
  } catch (error) {
    console.warn('Admin fetch users error:', error);
    return [];
  }
};

export const toggleUserActiveApi = async (userId: number): Promise<boolean> => {
  const response = await api.put(`/admin/users/${userId}/toggle-active`);
  return response.data.is_active;
};

export const setUserRoleApi = async (userId: number, role: 'customer' | 'provider'): Promise<string> => {
  const response = await api.put(`/admin/users/${userId}/role`, { role });
  return response.data.role;
};

export const fetchAdminStatsApi = async (): Promise<AdminStats> => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    return {
      total_users: 0,
      total_customers: 0,
      total_providers: 0,
      total_services: 0,
      pending_services: 0,
      approved_services: 0,
      rejected_services: 0,
      total_views: 0,
      total_calls: 0
    };
  }
};

export const checkUserApi = async (email: string): Promise<{ exists: boolean; user?: UserData }> => {
  const response = await api.post('/auth/check', { email });
  return response.data;
};

export const registerUser = async (
  email: string,
  password?: string,
  fullName?: string,
  phone?: string,
  role: 'customer' | 'provider' = 'customer'
) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    full_name: fullName,
    phone,
    role
  });
  return response.data;
};

export const completeProfileApi = async (data: ProfileCompleteData): Promise<UserData> => {
  const response = await api.post('/auth/complete-profile', {
    email: data.email,
    full_name: data.fullName,
    phone: data.phone,
    city: data.city,
    business_name: data.businessName,
    activity_type: data.activityType,
    avatar_url: data.avatarUrl,
    role: data.role
  });
  // Profil to'ldirilgach JWT token olish uchun avtomatik login
  try {
    const loginRes = await api.post('/auth/login', { email: data.email, password: '' });
    if (loginRes.data?.access_token) {
      localStorage.setItem('access_token', loginRes.data.access_token);
    }
  } catch (err) {
    console.warn('Auto-login after profile completion warning:', err);
  }
  return response.data;
};

export const loginUser = async (email: string, password?: string) => {
  const response = await api.post('/auth/login', { email, password });
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  return response.data;
};

export const loginWithTelegram = async (initData: string) => {
  const response = await api.post('/auth/telegram', { init_data: initData });
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }
  return response.data;
};

export const adminLogin = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const data = response.data;
  if (data?.user?.role !== 'admin') {
    throw new Error("Bu hisob admin huquqiga ega emas.");
  }
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  return data;
};
