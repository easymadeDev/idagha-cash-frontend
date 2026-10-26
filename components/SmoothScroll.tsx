import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

// Inertia scrolling for the whole site, driven from GSAP's ticker so pinned and
// scrubbed ScrollTriggers stay frame-perfect with the eased scroll position.
// Also draws a glowing scroll-progress line and publishes scroll velocity as
// the CSS variable --scroll-v (about -1 … 1) for speed-reactive effects.
export default function SmoothScroll() {
  const router = useRouter();
  const lenisRef = useRef<Lenis | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.25,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out: glides, then settles
      smoothWheel: true,
      touchMultiplier: 1.4,
      // Let popups, menus and modals scroll natively inside themselves
      prevent: (node: HTMLElement) => !!node.closest?.('.modal, .modal-overlay, .wp-popup, .nav-links.mobile-open, .lightbox, [data-lenis-prevent]'),
    });
    lenisRef.current = lenis;

    const root = document.documentElement;
    const settle = gsap.quickTo(root, '--scroll-v', { duration: 0.6, ease: 'power3.out' } as any);
    lenis.on('scroll', ({ progress, velocity }: { progress: number; velocity: number }) => {
      ScrollTrigger.update();
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress || 0})`;
      settle(gsap.utils.clamp(-1, 1, velocity / 40));
    });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // In-page anchors (#story) glide instead of jumping
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href') || '');
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -90 });
    };
    document.addEventListener('click', onClick);

    return () => {
      gsap.ticker.remove(tick);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // New page: start at the top immediately and re-measure triggers
  useEffect(() => {
    const done = () => {
      lenisRef.current?.scrollTo(0, { immediate: true });
      setTimeout(() => ScrollTrigger.refresh(), 300);
    };
    router.events.on('routeChangeComplete', done);
    return () => router.events.off('routeChangeComplete', done);
  }, [router.events]);

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
