import axios from 'axios';

const MEMBER_TOKEN_KEY = 'idagha_member_token';

export function getMemberToken(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(MEMBER_TOKEN_KEY) || localStorage.getItem(MEMBER_TOKEN_KEY) || '';
}

// Axios instance for member-only endpoints (x-member-token instead of the admin Bearer token)
export const memberApi = axios.create({ baseURL: '/api' });
memberApi.interceptors.request.use((config) => {
  const token = getMemberToken();
  if (token) config.headers['x-member-token'] = token;
  return config;
});

// SWR fetchers
export const fetcher = (url: string) => fetch(url).then((r) => r.json());
export const memberFetcher = (url: string) =>
  fetch(url, { headers: { 'x-member-token': getMemberToken() } }).then((r) => {
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  });
export const adminFetcher = (url: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('idagha_token') || '' : ''}` },
  }).then((r) => r.json());

export const errorMessage = (err: any, fallback = 'Something went wrong. Please try again.') => {
  const m = err?.response?.data?.message;
  return Array.isArray(m) ? m[0] : m || fallback;
};

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
