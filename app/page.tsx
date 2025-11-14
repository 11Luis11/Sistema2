'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/login-form';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return <LoginForm />;
}
