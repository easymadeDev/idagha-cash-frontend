import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import WelcomePopup from '../components/WelcomePopup';
import { GateContext, SessionMember } from '../lib/gate';
import { ToastProvider } from '../components/Toast';

const GATE_TOKEN_KEY  = 'idagha_gate_token';
const MEMBER_TOKEN_KEY = 'idagha_member_token';
const MEMBER_KEY       = 'idagha_member';

const EXEMPT = (pathname: string) =>
  pathname === '/' ||
  pathname === '/home' ||
  pathname === '/test' ||
  pathname === '/register' ||
  pathname.startsWith('/admin');

function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [cleared, setClearedState] = useState(false);
  const [member, setMemberState] = useState<SessionMember | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const gateToken = sessionStorage.getItem(GATE_TOKEN_KEY);
    if (isTokenValid(gateToken)) setClearedState(true);
    try {
      const raw = sessionStorage.getItem(MEMBER_KEY);
      if (raw) setMemberState(JSON.parse(raw));
    } catch {}
  }, []);

  const setCleared = (v: boolean) => {
    if (typeof window !== 'undefined') {
      if (!v) {
        sessionStorage.removeItem(GATE_TOKEN_KEY);
        sessionStorage.removeItem(MEMBER_TOKEN_KEY);
        sessionStorage.removeItem(MEMBER_KEY);
      }
    }
    setClearedState(v);
  };

  const setMember = (m: SessionMember | null) => {
    if (typeof window !== 'undefined') {
      if (m) sessionStorage.setItem(MEMBER_KEY, JSON.stringify(m));
      else sessionStorage.removeItem(MEMBER_KEY);
    }
    setMemberState(m);
  };

  useEffect(() => {
    if (EXEMPT(router.pathname)) return;
    if (!cleared) {
      // Re-check token in case it expired since last render
      const gateToken = typeof window !== 'undefined' ? sessionStorage.getItem(GATE_TOKEN_KEY) : null;
      if (!isTokenValid(gateToken)) router.replace('/');
    }
  }, [router.pathname, cleared]);

  return (
    <ToastProvider>
      <GateContext.Provider value={{ cleared, setCleared, member, setMember }}>
        <WelcomePopup />
        <Component {...pageProps} />
      </GateContext.Provider>
    </ToastProvider>
  );
}
