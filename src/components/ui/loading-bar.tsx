'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function LoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // Start loading
    setLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(60), 100);
    const timer2 = setTimeout(() => setProgress(80), 200);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-100 h-1">
      <div
        className={cn(
          'h-full bg-linear-to-r from-primary via-violet-500 to-primary transition-all duration-300 ease-out shadow-lg shadow-primary/50',
          loading ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
