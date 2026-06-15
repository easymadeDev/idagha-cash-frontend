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

export const formatDate = (date: string | Date) => {
  try {
    return new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return new Date(date).toLocaleDateString();
  }
};
