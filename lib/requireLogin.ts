import { useRouter } from 'next/router';

// Pages anyone can browse without signing in (kept in step with FULLY_EXEMPT in pages/_app)
export const isPublicPath = (href: string) => {
  const path = href.split('?')[0];
  return path === '/elections' || path.startsWith('/elections/') || path === '/awards';
};
import { useGate } from './gate';

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
