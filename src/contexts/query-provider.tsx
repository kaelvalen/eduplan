'use client';

/**
 * TanStack Query Provider
 * Global provider for React Query
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Global query options
            staleTime: 1 * 60 * 1000, // 1 minute (was 5, reduced for faster updates)
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: 1,
            refetchOnWindowFocus: true, // ✅ Changed to true for better UX
            refetchOnMount: 'always', // ✅ Always refetch on mount
            refetchOnReconnect: true,
          },
          mutations: {
            // Global mutation options
            retry: 0,
            onError: (error) => {
              console.error('❌ Mutation error:', error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
