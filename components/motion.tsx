import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';

export const EASE = [0.22, 1, 0.36, 1] as const;

// Fade-and-rise as the block scrolls into view. Content renders visible
// on the server; motion only adds the travel once hydrated.
export function Reveal({ children, delay = 0, y = 28, className, style, as = 'div' }: {
  children: React.ReactNode; delay?: number; y?: number; className?: string; style?: React.CSSProperties; as?: 'div' | 'section' | 'li';
}) {
  const reduce = useReducedMotion();
  const Tag: any = motion[as];
  return (
    <Tag
      className={className}
      style={style}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
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
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : 'hide'}
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
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
    }, { rootMargin: '0px 0px -6% 0px' });

    const scan = () => {
      const fresh = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))
        .filter((el) => !el.dataset.rv && !el.closest('.modal, .modal-overlay, .lightbox, [data-no-reveal]'));
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
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(t); };
  }, [rootRef, key]);
}
