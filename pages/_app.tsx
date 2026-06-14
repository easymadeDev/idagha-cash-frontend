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

function useAnimatedFavicon() {
  useEffect(() => {
    try {
      const SIZE = 32;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new window.Image();
      img.src = '/logo.png';

      let angle = 0;
      let rafId: number;
      let favicon = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }

      const draw = () => {
        try {
          ctx.clearRect(0, 0, SIZE, SIZE);

          ctx.save();
          ctx.translate(SIZE / 2, SIZE / 2);
          ctx.beginPath();
          ctx.arc(0, 0, SIZE / 2 - 2, 0, Math.PI * 2);
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([12, 8]);
          ctx.lineDashOffset = -angle * 20;
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();

          ctx.save();
          ctx.beginPath();
          ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 5, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, 5, 5, SIZE - 10, SIZE - 10);
          ctx.restore();

          favicon!.href = canvas.toDataURL('image/png');
          angle += 0.04;
          rafId = requestAnimationFrame(draw);
        } catch (_) {}
      };

      img.onload = () => { draw(); };
      img.onerror = () => {};

      return () => { cancelAnimationFrame(rafId); };
    } catch (_) {}
  }, []);
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [cleared, setCleared] = useState(false);

  useAnimatedFavicon();

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
