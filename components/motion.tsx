import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

// True once the element has entered the viewport. Besides the observer, a check after
// scrolling settles catches blocks that a fast phone flick carried past the observer.
function useRevealed(ref: React.RefObject<HTMLElement>) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return;
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) setShown(true); }, { rootMargin: '0px 0px 12% 0px' });
    io.observe(el);
    let t: ReturnType<typeof setTimeout> | undefined;
    const check = () => { clearTimeout(t); t = setTimeout(() => { if (el.getBoundingClientRect().top < window.innerHeight) setShown(true); }, 120); };
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => { io.disconnect(); clearTimeout(t); window.removeEventListener('scroll', check); };
  }, [ref, shown]);
  return shown;
}

// Fade-and-rise as the block scrolls into view.
export function Reveal({ children, delay = 0, y = 28, className, style, as = 'div' }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties; as?: 'div' | 'section' | 'li';
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const shown = useRevealed(ref);
  const Tag: any = motion[as];
  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      animate={shown || reduce ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}

// Staggers its direct <Item> children
export function Stagger({ children, className, style, gap = 0.07 }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; gap?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRevealed(ref);
  return (
    <motion.div
      ref={ref}
      className={className}
      style={style}
      initial={reduce ? false : 'hide'}
      animate={shown || reduce ? 'show' : 'hide'}
      variants={{ hide: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function Item({ children, className, style, onClick }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      onClick={onClick}
      variants={{ hide: { opacity: 0, y: 24, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } } }}
    >
      {children}
    </motion.div>
  );
}

// Counts up to the value when it scrolls into view
export function CountUp({ value, format = (n: number) => Math.round(n).toLocaleString(), duration = 1.4 }: {
  value: number; format?: (n: number) => string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) { setShown(value); return; }
    const controls = animate(0, value, { duration, ease: EASE, onUpdate: setShown });
    return () => controls.stop();
  }, [inView, value, reduce, duration]);

  return <span ref={ref} style={{ fontVariantNumeric: 'tabular-nums' }}>{format(shown)}</span>;
}

// Site-wide scroll reveal for the older pages: every card-like block rises in
// as it enters the viewport. Failure mode is "visible", never "hidden".
const REVEAL_SELECTOR = [
  '.card', '.stat-card', '.quick-card', '.contrib-card', '.table-wrap', '.milestone-card',
  '.wallet-card-wrap', '.event-card', '.exec-card', '.award-card', '.poster', '.masonry figure',
  '.candidate', '.nominee-row', '.announce-bar', '.hm-panel', '.hm-tile',
].join(',');

export function useAutoReveal(rootRef: React.RefObject<HTMLElement>, key: string) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('rv-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px 8% 0px' });

    // Fast flick-scrolls on phones can skip an element past the observer:
    // after scrolling settles, reveal everything at or above the bottom of the screen
    let settle: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => {
        root.querySelectorAll('.rv:not(.rv-in)').forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('rv-in');
        });
      }, 120);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    const scan = () => {
      const fresh = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))
        .filter((el) => !el.dataset.rv && !el.closest('.modal, .modal-overlay, .lightbox, [data-no-reveal]'))
        // Framer-animated blocks already carry an inline opacity: leave their motion to Framer
        .filter((el) => !/opacity/.test(el.getAttribute('style') || ''));
      fresh.forEach((el, i) => {
        el.dataset.rv = '1';
        el.style.setProperty('--rv-i', String(i % 8));
        el.classList.add('rv');
        io.observe(el);
      });
    };
    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(root, { childList: true, subtree: true });
    // Safety net: never leave anything invisible
    const t = setTimeout(() => root.querySelectorAll('.rv:not(.rv-in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) el.classList.add('rv-in');
    }), 2500);
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(t); clearTimeout(settle); window.removeEventListener('scroll', onScroll); };
  }, [rootRef, key]);
}
