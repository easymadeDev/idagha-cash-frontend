import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import WelcomePopup from '../components/WelcomePopup';
import { GateContext, SessionMember } from '../lib/gate';
import { ToastProvider } from '../components/Toast';

const SESSION_KEY = 'idagha_gate_cleared';
const MEMBER_KEY  = 'idagha_member';

const EXEMPT = (pathname: string) =>
  pathname === '/' ||
  pathname === '/home' ||
  pathname === '/test' ||
  pathname === '/register' ||
  pathname === '/profile' ||
  pathname.startsWith('/admin');

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [cleared, setClearedState] = useState(false);
  const [member, setMemberState] = useState<SessionMember | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY) === '1') setClearedState(true);
    try {
      const raw = sessionStorage.getItem(MEMBER_KEY);
      if (raw) setMemberState(JSON.parse(raw));
    } catch {}
  }, []);

  const setCleared = (v: boolean) => {
    if (typeof window !== 'undefined') {
      if (v) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
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
    if (!cleared) router.replace('/home');
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
