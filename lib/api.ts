import axios from 'axios';

const BACKEND = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({ baseURL: BACKEND });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('idagha_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

export const formatNaira = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);
  } catch {
    // Fallback for iOS 15 which may not support en-NG locale
    return '₦' + amount.toLocaleString();
  }
};

// ── Pledge API helpers ────────────────────────────────────────────────────

export const pledgeApi = {
  getAll: (status?: string) =>
    api.get('/pledges', { params: status ? { status } : {} }),
  getStats: () => api.get('/pledges/stats'),
  getOne: (id: string) => api.get(`/pledges/${id}`),
  // Member self-pledge
  create: (data: {
    memberName: string;
    memberEmail?: string;
    memberPhone?: string;
    memberId?: string;
    amount: number;
    note?: string;
    dueDate?: string;
  }) => api.post('/pledges', data),
  // Admin adds pledge for a member
  adminCreate: (data: {
    memberName: string;
    memberEmail?: string;
    memberPhone?: string;
    memberId?: string;
    amount: number;
    note?: string;
    dueDate?: string;
  }) => api.post('/pledges/admin', data),
  update: (id: string, data: Partial<{ memberName: string; memberEmail: string; memberPhone: string; amount: number; note: string; dueDate: string }>) =>
    api.put(`/pledges/${id}`, data),
  fulfill: (id: string) => api.put(`/pledges/${id}/fulfill`, {}),
  remove: (id: string) => api.delete(`/pledges/${id}`),
  sendReminders: (pledgeIds?: string[]) =>
    api.post('/pledges/reminders/send', { pledgeIds }),
};

export const formatDate = (date: string | Date) => {
  try {
    return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return new Date(date).toLocaleDateString();
  }
};
