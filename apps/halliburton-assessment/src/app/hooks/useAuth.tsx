'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function useAuth(isAdminRoute = false) {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user || !user.token) {
      router.push('/auth');
    } else if (isAdminRoute && user.role !== 'admin') {
      router.push('/');
    }
  }, [router, isAdminRoute]);
}
