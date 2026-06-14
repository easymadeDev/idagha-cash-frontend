import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('idagha_token');
    router.replace(token ? '/admin/dashboard' : '/admin/login');
  }, [router]);
  return null;
}
