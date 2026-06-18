import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGate } from '../lib/gate';

export default function Index() {
  const router = useRouter();
  const { cleared } = useGate();

  useEffect(() => {
    if (cleared) router.replace('/home');
  }, [cleared]);

  return null;
}
