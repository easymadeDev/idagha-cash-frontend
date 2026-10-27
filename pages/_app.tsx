import { useState, useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import '../styles/alumni.css';
import '../styles/theme.css';
import '../styles/cine.css';
import 'lenis/dist/lenis.css';
import '../styles/glass.css';
import '../styles/skin-glass.css';
import { SkinSwitch } from '../lib/skin';
import { isPublicPath, AFTER_PIN_KEY } from '../lib/requireLogin';
import Interactions from '../components/Interactions';
import '../styles/enhance.css';
import SmoothScroll from '../components/SmoothScroll';
import WelcomePopup from '../components/WelcomePopup';
import WhatsAppPrompt from '../components/WhatsAppPrompt';
import { GateContext, SessionMember } from '../lib/gate';
import { ToastProvider } from '../components/Toast';

const GATE_TOKEN_KEY   = 'idagha_gate_token';
const MEMBER_TOKEN_KEY = 'idagha_member_token';
const MEMBER_KEY       = 'idagha_member';
const REGISTERED_KEY   = 'idagha_registered'; // set after self-registration (pending approval)

// Member token is stored in both sessionStorage (fast) and localStorage (survives tab close)
function getMemberToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(MEMBER_TOKEN_KEY) || localStorage.getItem(MEMBER_TOKEN_KEY);
}
function saveMemberToken(token: string) {
  sessionStorage.setItem(MEMBER_TOKEN_KEY, token);
  localStorage.setItem(MEMBER_TOKEN_KEY, token);
}
function clearMemberToken() {
  sessionStorage.removeItem(MEMBER_TOKEN_KEY);
  localStorage.removeItem(MEMBER_TOKEN_KEY);
}

// Fully open — no token needed. Elections and alumni awards can be browsed by anyone;
// buying a form, applying, voting, nominating and supporting ask for sign-in on the page itself.
const FULLY_EXEMPT = (pathname: string) =>
  pathname === '/' ||
  pathname === '/test' ||
  pathname.startsWith('/admin') ||
  isPublicPath(pathname);

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
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    const memberToken  = getMemberToken();
    const registered   = sessionStorage.getItem(REGISTERED_KEY);
    // Sync localStorage token into sessionStorage so reads are consistent
    if (memberToken) sessionStorage.setItem(MEMBER_TOKEN_KEY, memberToken);
    if (isTokenValid(memberToken) || registered === '1') setClearedState(true);
    try {
      const raw = sessionStorage.getItem(MEMBER_KEY) || localStorage.getItem(MEMBER_KEY);
      if (raw) {
        setMemberState(JSON.parse(raw));
        // Keep both storages in sync
        sessionStorage.setItem(MEMBER_KEY, raw);
      }
    } catch {}
    setReady(true); // gate checks can now run safely
  }, []);

  const setCleared = (v: boolean) => {
    if (typeof window !== 'undefined') {
      if (!v) {
        sessionStorage.removeItem(GATE_TOKEN_KEY);
        clearMemberToken();
        sessionStorage.removeItem(MEMBER_KEY);
        localStorage.removeItem(MEMBER_KEY);
        sessionStorage.removeItem(REGISTERED_KEY);
      }
    }
    setClearedState(v);
  };

  const setMember = (m: SessionMember | null) => {
    if (typeof window !== 'undefined') {
      if (m) {
        const serialized = JSON.stringify(m);
        sessionStorage.setItem(MEMBER_KEY, serialized);
        localStorage.setItem(MEMBER_KEY, serialized);
      } else {
        sessionStorage.removeItem(MEMBER_KEY);
        localStorage.removeItem(MEMBER_KEY);
      }
    }
    setMemberState(m);
  };

  useEffect(() => {
    if (!ready) return;
    if (FULLY_EXEMPT(router.pathname)) return;
    if (cleared) return; // already verified — no redirect needed

    const memberToken = getMemberToken();
    const registered  = sessionStorage.getItem(REGISTERED_KEY);
    const gateToken   = sessionStorage.getItem(GATE_TOKEN_KEY);

    if (GATE_ONLY(router.pathname)) {
      if (!isTokenValid(gateToken)) {
        // came by a register link: after the PIN, go straight back to the form (no "are you a member?")
        sessionStorage.setItem(AFTER_PIN_KEY, router.asPath);
        router.replace('/?signin=1');
      }
      return;
    }

    if (!isTokenValid(memberToken) && registered !== '1') {
      // Save intended destination so login can redirect back to it
      sessionStorage.setItem('idagha_redirect_after_login', router.asPath);
      router.replace('/?signin=1');
    }
  }, [router.pathname, ready, cleared]);

  return (
    <ToastProvider>
      <GateContext.Provider value={{ cleared, setCleared, member, setMember, ready, gateOpen, setGateOpen }}>
        {/* Shared crest-shield clip path used to mask photographs site-wide */}
        <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
          <defs>
            <clipPath id="shield-clip" clipPathUnits="objectBoundingBox">
              <path d="M0,0 H1 V0.56 C1,0.79 0.76,0.92 0.5,1 C0.24,0.92 0,0.79 0,0.56 Z" />
            </clipPath>
          </defs>
        </svg>
        <SmoothScroll />
        <SkinSwitch />
        <Interactions />
        <WelcomePopup />
        <WhatsAppPrompt />
        <Component {...pageProps} />
      </GateContext.Provider>
    </ToastProvider>
  );
}
