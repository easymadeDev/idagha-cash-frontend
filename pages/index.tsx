import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGate } from '../lib/gate';

export default function Index() {
  const router = useRouter();
  const { cleared, ready } = useGate();

  useEffect(() => {
    if (!ready) return;
    if (cleared) router.replace('/home');
    // If not cleared, WelcomePopup handles the gate — stay on /
  }, [ready, cleared]);

  return null;
}
