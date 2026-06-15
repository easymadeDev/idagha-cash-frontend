import { useState, useEffect, createContext, useContext } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import WelcomePopup from '../components/WelcomePopup';

// In-memory gate — resets on every hard page load (no sessionStorage)
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
  const [cleared, setCleared] = useState(false);

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
