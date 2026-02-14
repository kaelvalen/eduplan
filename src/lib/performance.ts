/**
 * Performance Monitoring Utilities
 * Tracks Web Vitals and custom performance metrics
 */

/**
 * Web Vitals metric types
 */
export type MetricName = 'CLS' | 'FCP' | 'FID' | 'LCP' | 'TTFB' | 'INP';

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  name: MetricName | string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * Web Vitals thresholds (in milliseconds)
 */
const THRESHOLDS = {
  // Cumulative Layout Shift (score, not ms)
  CLS: { good: 0.1, poor: 0.25 },
  // First Contentful Paint
  FCP: { good: 1800, poor: 3000 },
  // First Input Delay
  FID: { good: 100, poor: 300 },
  // Largest Contentful Paint
  LCP: { good: 2500, poor: 4000 },
  // Time to First Byte
  TTFB: { good: 800, poor: 1800 },
  // Interaction to Next Paint
  INP: { good: 200, poor: 500 },
};

/**
 * Get rating for a metric value
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRating(name: MetricName, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals metric
 */
export function reportWebVitals(metric: PerformanceMetric) {
  const { name, value, rating } = metric;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}:`, {
      value: `${Math.round(value)}${name === 'CLS' ? '' : 'ms'}`,
      rating,
    });
  }

  // Log poor metrics
  if (rating === 'poor') {
    console.warn('[Performance] Poor Web Vital detected:', {
      metric: name,
      value: Math.round(value),
      rating,
    });
  }

  // Send to analytics (placeholder - integrate with your analytics service)
  sendToAnalytics(metric);
}

/**
 * Send metrics to analytics service
 * TODO: Integrate with your analytics provider (Google Analytics, Vercel Analytics, etc.)
 */
function sendToAnalytics(metric: PerformanceMetric) {
  // Example: Google Analytics 4
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).gtag) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      metric_id: metric.id,
    });
  }

  // Example: Vercel Analytics
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).va) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).va('track', 'Web Vitals', {
      metric: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
    });
  }
}

/**
 * Performance mark utility
 */
export class PerformanceMarker {
  private marks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * End timing and return duration
   */
  end(label: string): number | null {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`No start mark found for "${label}"`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    // Log slow operations (>1 second)
    if (duration > 1000) {
      console.warn('[Performance] Slow operation detected:', {
        operation: label,
        duration: Math.round(duration),
      });
    }

    return duration;
  }

  /**
   * Measure and log duration
   */
  measure(label: string): number | null {
    const duration = this.end(label);
    if (duration !== null) {
      console.log(`[Performance] ${label}: ${Math.round(duration)}ms`);
    }
    return duration;
  }
}

/**
 * Global performance marker instance
 */
export const performanceMarker = new PerformanceMarker();

/**
 * Track API request performance
 */
export function trackApiRequest(endpoint: string, duration: number, status: number) {
  const metric: PerformanceMetric = {
    name: `API: ${endpoint}`,
    value: duration,
    rating: duration < 200 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
  };

  if (metric.rating !== 'good') {
    console.log('[Performance] API Request Performance:', {
      endpoint,
      duration: Math.round(duration),
      status,
      rating: metric.rating,
    });
  }
}

/**
 * Track scheduler generation performance
 */
export function trackSchedulerPerformance(duration: number, courseCount: number) {
  const metric: PerformanceMetric = {
    name: 'Scheduler Generation',
    value: duration,
    rating: duration < 10000 ? 'good' : duration < 30000 ? 'needs-improvement' : 'poor',
  };

  console.log('[Performance] Scheduler Performance:', {
    duration: Math.round(duration),
    courseCount,
    rating: metric.rating,
  });
}

/**
 * Get current performance metrics
 */
export function getCurrentPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  return {
    // Navigation timing
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    ttfb: navigation.responseStart - navigation.requestStart,
    download: navigation.responseEnd - navigation.responseStart,
    domProcessing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
    total: navigation.loadEventEnd - navigation.fetchStart,

    // Memory (if available)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    memory: (performance as any).memory
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          total: Math.round((performance as any).memory.totalJSHeapSize / 1048576),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1048576),
        }
      : null,
  };
}
