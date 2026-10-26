import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Two whole-app looks to compare: 'cine' (dark cinematic, default) and 'glass'
// (white-and-blue frosted glass). Chosen with the floating switch or ?skin=glass,
// remembered per browser, and applied as <html data-skin="...">.
export type Skin = 'cine' | 'glass';
const KEY = 'idagha_skin';
const EVENT = 'idagha-skin';

function readSkin(): Skin {
  if (typeof window === 'undefined') return 'cine';
  const q = new URLSearchParams(window.location.search).get('skin');
  if (q === 'glass' || q === 'cine') { try { localStorage.setItem(KEY, q); } catch {} return q; }
  try { return localStorage.getItem(KEY) === 'glass' ? 'glass' : 'cine'; } catch { return 'cine'; }
}

export function useSkin(): [Skin, (s: Skin) => void] {
  const [skin, setSkinState] = useState<Skin>('cine');
  useEffect(() => {
    setSkinState(readSkin());
    const on = () => setSkinState(readSkin());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  const setSkin = (s: Skin) => {
    try { localStorage.setItem(KEY, s); } catch {}
    window.dispatchEvent(new Event(EVENT));
  };
  return [skin, setSkin];
}

// Applies the skin to <html> and shows the comparison switch
export function SkinSwitch() {
  const [skin, setSkin] = useSkin();
  useEffect(() => { document.documentElement.dataset.skin = skin; }, [skin]);
  return (
    <div className="skin-switch" role="group" aria-label="Choose a design to compare">
      {(['cine', 'glass'] as Skin[]).map((s) => (
        <button key={s} className={skin === s ? 'on' : ''} onClick={() => setSkin(s)} aria-pressed={skin === s}>
          {skin === s && <motion.span layoutId="skin-on" className="skin-on" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span>{s === 'cine' ? 'Cinematic' : 'Glass'}</span>
        </button>
      ))}
    </div>
  );
}
