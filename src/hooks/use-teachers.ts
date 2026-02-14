'use client';

/**
 * Teacher Hooks - React Query based
 * Manages teacher data fetching, mutations, and cache
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teachersApi } from '@/lib/api';
import type { TeacherCreate, FilterOptions } from '@/types';

// Query keys
export const teacherKeys = {
  all: ['teachers'] as const,
  lists: () => [...teacherKeys.all, 'list'] as const,
  list: (filters?: FilterOptions) => [...teacherKeys.lists(), { filters }] as const,
  details: () => [...teacherKeys.all, 'detail'] as const,
  detail: (id: number) => [...teacherKeys.details(), id] as const,
  schedule: (id: number) => [...teacherKeys.detail(id), 'schedule'] as const,
};

/**
 * Get all teachers with optional filters
 */
export function useTeachers(filters?: FilterOptions) {
  return useQuery({
    queryKey: teacherKeys.list(filters),
    queryFn: () => teachersApi.getAll(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes (teachers change less frequently)
  });
}

/**
 * Get single teacher by ID
 */
export function useTeacher(id: number, enabled = true) {
  return useQuery({
    queryKey: teacherKeys.detail(id),
    queryFn: () => teachersApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get teacher schedule
 */
export function useTeacherSchedule(id: number, enabled = true) {
  return useQuery({
    queryKey: teacherKeys.schedule(id),
    queryFn: () => teachersApi.getSchedule(id),
    enabled: enabled && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes for schedules
  });
}

/**
 * Create new teacher
 */
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeacherCreate) => teachersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      toast.success('Öğretim elemanı başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Öğretim elemanı eklenirken bir hata oluştu');
    },
  });
}

/**
 * Update existing teacher
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeacherCreate }) =>
      teachersApi.update(id, data),
    onSuccess: (updatedTeacher, variables) => {
      queryClient.setQueryData(
        teacherKeys.detail(variables.id),
        updatedTeacher
      );
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teacherKeys.schedule(variables.id) });
      toast.success('Öğretim elemanı başarıyla güncellendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Öğretim elemanı güncellenirken bir hata oluştu');
    },
  });
}

/**
 * Delete teacher
 */
export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => teachersApi.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: teacherKeys.lists() });
      const previousTeachers = queryClient.getQueriesData({ queryKey: teacherKeys.lists() });
      
      queryClient.setQueriesData(
        { queryKey: teacherKeys.lists() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (old: any) => old ? old.filter((teacher: any) => teacher.id !== deletedId) : []
      );
      
      return { previousTeachers };
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: teacherKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: teacherKeys.schedule(deletedId) });
      toast.success('Öğretim elemanı başarıyla silindi');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousTeachers) {
        context.previousTeachers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Öğretim elemanı silinirken bir hata oluştu');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.lists() });
    },
  });
}

/**
 * Prefetch teachers
 */
export function usePrefetchTeachers() {
  const queryClient = useQueryClient();

  return (filters?: FilterOptions) => {
    queryClient.prefetchQuery({
      queryKey: teacherKeys.list(filters),
      queryFn: () => teachersApi.getAll(filters),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Prefetch single teacher
 */
export function usePrefetchTeacher() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: teacherKeys.detail(id),
      queryFn: () => teachersApi.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}
