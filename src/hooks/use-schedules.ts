'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { schedulesApi } from '@/lib/api';
import type { Schedule } from '@/types';

// Query keys for React Query
export const scheduleKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleKeys.all, 'list'] as const,
  list: (filters?: any) => [...scheduleKeys.lists(), filters] as const,
  details: () => [...scheduleKeys.all, 'detail'] as const,
  detail: (id: number) => [...scheduleKeys.details(), id] as const,
};

export function useSchedules() {
  const queryClient = useQueryClient();

  const { data: schedules = [], isLoading, error } = useQuery({
    queryKey: scheduleKeys.lists(),
    queryFn: async () => {
      console.log('🔍 Fetching schedules from API...');
      const data = await schedulesApi.getAll();
      console.log('✅ Schedules fetched:', data.length, 'items');
      console.log('📋 First schedule:', data[0]);
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (id: number) => schedulesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      toast.success('Program başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Program silinirken bir hata oluştu');
    },
  });

  const deleteByDaysMutation = useMutation({
    mutationFn: (days: string[]) => schedulesApi.deleteByDays(days),
    onMutate: async (daysToDelete) => {
      await queryClient.cancelQueries({ queryKey: scheduleKeys.lists() });
      const previousSchedules = queryClient.getQueriesData({ queryKey: scheduleKeys.lists() });
      
      // Optimistically remove schedules
      queryClient.setQueriesData(
        { queryKey: scheduleKeys.lists() },
        (old: any) => old ? old.filter((s: any) => !daysToDelete.includes(s.day)) : []
      );
      
      return { previousSchedules };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      toast.success('Programlar başarıyla silindi');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousSchedules) {
        context.previousSchedules.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Programlar silinirken bir hata oluştu');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
  });

  const fetchSchedules = () => {
    queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
  };

  return {
    schedules,
    isLoading,
    error: error?.message || null,
    fetchSchedules,
    deleteSchedule: deleteScheduleMutation.mutate,
    deleteByDays: deleteByDaysMutation.mutate,
  };
}
