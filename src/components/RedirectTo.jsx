'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectTo({ href, replace = false }) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }, [href, replace, router]);

  return null;
}
