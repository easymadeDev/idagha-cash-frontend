import { useEffect, useRef } from 'react';

// Site-wide pointer effects (mouse only; nothing on touch screens or with reduced motion):
//  - a soft light that follows the cursor
//  - cards that tilt toward the pointer in 3D, with a sheen
//  - buttons that are pulled slightly toward the pointer ("magnetic")
// Uses the CSS `rotate`/`translate` individual properties so it never fights the
// reveal and hover `transform`s that other code sets on the same elements.
const TILT = '.card, .hm-panel, .hm-tile, .event-card, .exec-card, .award-card, .contrib-card, .stat-card, .wallet-card-wrap, .gl-feature, .gl-exec, .gl-num, .cx-exec, .poster';
const MAGNET = '.btn, .cx-btn, .gl-btn, .hm-link';

export default function Interactions() {
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;
    document.documentElement.classList.add('has-pointer');

    let tilted: HTMLElement | null = null;
    let pulled: HTMLElement | null = null;
    let raf = 0;
    let last: PointerEvent | null = null;

    const reset = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.rotate = '';
      el.style.translate = '';
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
      el.classList.remove('is-tilting');
    };

    const frame = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      if (glow.current) glow.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      const target = e.target as HTMLElement;

      // Tilt the card under the pointer
      const card = target.closest?.(TILT) as HTMLElement | null;
      if (card !== tilted) { reset(tilted); tilted = card; }
      if (card) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        // small elements tilt more, large panels barely move
        const k = Math.min(1, 320 / Math.max(r.width, r.height));
        card.style.rotate = `${-py} ${px} 0 ${Math.hypot(px, py) * 9 * k}deg`;
        card.style.setProperty('--mx', `${(px + 0.5) * 100}%`);
        card.style.setProperty('--my', `${(py + 0.5) * 100}%`);
        card.classList.add('is-tilting');
      }

      // Pull the button under the pointer
      const btn = target.closest?.(MAGNET) as HTMLElement | null;
      if (btn !== pulled) { if (pulled) pulled.style.translate = ''; pulled = btn; }
      if (btn && !(btn as HTMLButtonElement).disabled) {
        const r = btn.getBoundingClientRect();
        btn.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.3}px`;
      }
    };

    const onMove = (e: PointerEvent) => { last = e; if (!raf) raf = requestAnimationFrame(frame); };
    const onLeave = () => { reset(tilted); tilted = null; if (pulled) pulled.style.translate = ''; pulled = null; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onLeave, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onLeave);
      cancelAnimationFrame(raf);
      onLeave();
      document.documentElement.classList.remove('has-pointer');
    };
  }, []);

  return <div ref={glow} className="cursor-glow" aria-hidden="true" />;
}
