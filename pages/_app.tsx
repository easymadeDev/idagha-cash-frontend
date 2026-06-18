import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import WelcomePopup from '../components/WelcomePopup';
import { GateContext, SessionMember } from '../lib/gate';
import { ToastProvider } from '../components/Toast';

const GATE_TOKEN_KEY   = 'idagha_gate_token';
const MEMBER_TOKEN_KEY = 'idagha_member_token';
const MEMBER_KEY       = 'idagha_member';
const REGISTERED_KEY   = 'idagha_registered'; // set after self-registration (pending approval)

// Fully open — no token needed
const FULLY_EXEMPT = (pathname: string) =>
  pathname === '/' ||
  pathname === '/test' ||
  pathname.startsWith('/admin');

// Requires only gate token (PIN passed) — not full member verification
const GATE_ONLY = (pathname: string) =>
  pathname === '/register';

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
  const [ready, setReady] = useState(false); // true after sessionStorage is read

  useEffect(() => {
    const memberToken  = sessionStorage.getItem(MEMBER_TOKEN_KEY);
    const registered   = sessionStorage.getItem(REGISTERED_KEY);
    if (isTokenValid(memberToken) || registered === '1') setClearedState(true);
    try {
      const raw = sessionStorage.getItem(MEMBER_KEY);
      if (raw) setMemberState(JSON.parse(raw));
    } catch {}
    setReady(true); // gate checks can now run safely
  }, []);

  const setCleared = (v: boolean) => {
    if (typeof window !== 'undefined') {
      if (!v) {
        sessionStorage.removeItem(GATE_TOKEN_KEY);
        sessionStorage.removeItem(MEMBER_TOKEN_KEY);
        sessionStorage.removeItem(MEMBER_KEY);
        sessionStorage.removeItem(REGISTERED_KEY);
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
    if (!ready) return;
    if (FULLY_EXEMPT(router.pathname)) return;
    if (cleared) return; // already verified — no redirect needed

    // Not yet verified — send back to / so the popup can show
    // Small delay so the popup's own dismiss() navigation takes priority
    const t = setTimeout(() => {
      const memberToken = sessionStorage.getItem(MEMBER_TOKEN_KEY);
      const registered  = sessionStorage.getItem(REGISTERED_KEY);
      const gateToken   = sessionStorage.getItem(GATE_TOKEN_KEY);

      if (GATE_ONLY(router.pathname)) {
        if (!isTokenValid(gateToken)) router.replace('/');
        return;
      }

      if (!isTokenValid(memberToken) && registered !== '1') router.replace('/');
    }, 50);
    return () => clearTimeout(t);
  }, [router.pathname, ready, cleared]);

  return (
    <ToastProvider>
      <GateContext.Provider value={{ cleared, setCleared, member, setMember, ready }}>
        <WelcomePopup />
        <Component {...pageProps} />
      </GateContext.Provider>
    </ToastProvider>
  );
}
