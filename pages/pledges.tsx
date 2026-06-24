import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PledgesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/reunion-support'); }, []);
  return null;
}
