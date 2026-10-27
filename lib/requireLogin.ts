import { useRouter } from 'next/router';
import { useGate } from './gate';

// Pages anyone can browse without signing in (pages/_app lets these through the gate)
export const isPublicPath = (href: string) => {
  const path = href.split('?')[0];
  return path === '/elections' || path.startsWith('/elections/') || path === '/awards'
    || path === '/events' || path.startsWith('/events/');
};

// Page a newly registered member wanted to act on, kept across sessions until their first approved sign-in
export const RETURN_AFTER_APPROVAL = 'idagha_return_after_approval';

export const describePath = (href: string) => {
  const path = href.split('?')[0];
  if (path.startsWith('/elections/')) return 'the election';
  if (path === '/elections') return 'Elections';
  if (path === '/awards') return 'Alumni awards';
  if (path.startsWith('/events/')) return 'the event';
  if (path === '/events') return 'Events';
  return 'where you were';
};

// For pages anyone can browse: run `action` if signed in; otherwise remember this page
// and open the sign-in popup, which brings the member straight back here afterwards.
export function useRequireLogin() {
  const router = useRouter();
  const { cleared, setGateOpen } = useGate();
  return (action: () => void) => {
    if (cleared) { action(); return; }
    try { sessionStorage.setItem('idagha_redirect_after_login', router.asPath); } catch {}
    setGateOpen(true);
  };
}
