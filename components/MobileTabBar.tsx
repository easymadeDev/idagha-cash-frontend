import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Home, CalendarDays, Vote, Wallet, Images } from 'lucide-react';
import { useGate } from '../lib/gate';
import { FINANCE_PATHS } from './Navbar';

// Phone-only bottom navigation for the member portal: the five places people go most,
// within thumb reach. The top menu still holds everything else.
const TABS = [
  { label: 'Home', href: '/home', icon: Home, match: ['/home'] },
  { label: 'Events', href: '/events', icon: CalendarDays, match: ['/events'] },
  { label: 'Vote', href: '/elections', icon: Vote, match: ['/elections', '/awards'] },
  { label: 'Finance', href: '/finance', icon: Wallet, match: FINANCE_PATHS },
  { label: 'Gallery', href: '/gallery', icon: Images, match: ['/gallery'] },
];

export default function MobileTabBar() {
  const router = useRouter();
  const { cleared } = useGate();
  if (!cleared) return null;
  const at = (m: string[]) => m.some((p) => router.pathname === p || router.pathname.startsWith(p + '/'));
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      {TABS.map((t) => {
        const Icon = t.icon;
        const on = at(t.match);
        return (
          <button key={t.href} className={on ? 'on' : ''} onClick={() => router.push(t.href)} aria-current={on ? 'page' : undefined}>
            {on && <motion.span layoutId="tabbar-on" className="tabbar-on" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <Icon size={21} strokeWidth={on ? 2.4 : 1.9} />
            <span>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
