import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGate } from '../lib/gate';

export default function Index() {
  const router = useRouter();
  const { cleared, ready } = useGate();

  useEffect(() => {
    if (!ready) return;
    if (cleared) router.replace('/home');
    // If not cleared, WelcomePopup shows the PIN gate on this page
  }, [ready, cleared]);

  // Dark background while popup loads — matches the popup overlay colour
  return <div style={{ minHeight: '100vh', background: '#030906' }} />;
}
