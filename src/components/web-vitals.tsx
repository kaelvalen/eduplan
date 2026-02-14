/**
 * Web Vitals Tracker Component
 * Tracks Core Web Vitals metrics (LCP, FID, CLS, etc.)
 */

'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals } from '@/lib/performance';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Report Core Web Vitals
    reportWebVitals({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: metric.name as any,
      value: metric.value,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rating: metric.rating as any,
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    });
  });

  useEffect(() => {
    // Log performance metrics on mount (development only)
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        const metrics = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (metrics) {
          console.log('[Performance] Navigation Timing:', {
            'DNS Lookup': `${Math.round(metrics.domainLookupEnd - metrics.domainLookupStart)}ms`,
            'TCP Connection': `${Math.round(metrics.connectEnd - metrics.connectStart)}ms`,
            'TTFB': `${Math.round(metrics.responseStart - metrics.requestStart)}ms`,
            'Download': `${Math.round(metrics.responseEnd - metrics.responseStart)}ms`,
            'DOM Processing': `${Math.round(metrics.domContentLoadedEventEnd - metrics.responseEnd)}ms`,
            'Total Load': `${Math.round(metrics.loadEventEnd - metrics.fetchStart)}ms`,
          });
        }

        // Log memory usage if available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((performance as any).memory) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const memory = (performance as any).memory;
          console.log('[Performance] Memory Usage:', {
            'Used': `${Math.round(memory.usedJSHeapSize / 1048576)}MB`,
            'Total': `${Math.round(memory.totalJSHeapSize / 1048576)}MB`,
            'Limit': `${Math.round(memory.jsHeapSizeLimit / 1048576)}MB`,
          });
        }
      }, 3000); // Wait 3s for metrics to be available

      return () => clearTimeout(timer);
    }
  }, []);

  return null; // This component doesn't render anything
}
