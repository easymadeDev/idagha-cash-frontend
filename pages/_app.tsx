import { useState, useEffect, createContext, useContext } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import WelcomePopup from '../components/WelcomePopup';

const SESSION_KEY = 'idagha_gate_cleared';

export const GateContext = createContext<{
  cleared: boolean;
  setCleared: (v: boolean) => void;
}>({ cleared: false, setCleared: () => {} });

export const useGate = () => useContext(GateContext);

const EXEMPT = (pathname: string) =>
  pathname === '/' ||
  pathname === '/home' ||
  pathname.startsWith('/admin');

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  // Read from sessionStorage on mount so navigation within same tab doesn't re-show popup
  const [cleared, setClearedState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem(SESSION_KEY) === '1') {
      setClearedState(true);
    }
  }, []);

  const setCleared = (v: boolean) => {
    if (typeof window !== 'undefined') {
      if (v) sessionStorage.setItem(SESSION_KEY, '1');
      else sessionStorage.removeItem(SESSION_KEY);
    }
    setClearedState(v);
  };

  useEffect(() => {
    if (EXEMPT(router.pathname)) return;
    if (!cleared) {
      router.replace('/home');
    }
  }, [router.pathname, cleared]);

  return (
    <GateContext.Provider value={{ cleared, setCleared }}>
      <WelcomePopup />
      <Component {...pageProps} />
    </GateContext.Provider>
  );
}
