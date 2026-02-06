'use client';

/**
 * Classroom Hooks - React Query based
 * Manages classroom data fetching, mutations, and cache
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classroomsApi } from '@/lib/api';
import type { Classroom, ClassroomCreate, FilterOptions } from '@/types';

// Query keys
export const classroomKeys = {
  all: ['classrooms'] as const,
  lists: () => [...classroomKeys.all, 'list'] as const,
  list: (filters?: FilterOptions) => [...classroomKeys.lists(), { filters }] as const,
  details: () => [...classroomKeys.all, 'detail'] as const,
  detail: (id: number) => [...classroomKeys.details(), id] as const,
  schedule: (id: number) => [...classroomKeys.detail(id), 'schedule'] as const,
};

/**
 * Get all classrooms with optional filters
 */
export function useClassrooms(filters?: FilterOptions) {
  return useQuery({
    queryKey: classroomKeys.list(filters),
    queryFn: () => classroomsApi.getAll(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get single classroom by ID
 */
export function useClassroom(id: number, enabled = true) {
  return useQuery({
    queryKey: classroomKeys.detail(id),
    queryFn: () => classroomsApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get classroom schedule
 */
export function useClassroomSchedule(id: number, enabled = true) {
  return useQuery({
    queryKey: classroomKeys.schedule(id),
    queryFn: () => classroomsApi.getSchedule(id),
    enabled: enabled && !!id,
    staleTime: 3 * 60 * 1000, // 3 minutes for schedules
  });
}

/**
 * Create new classroom
 */
export function useCreateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassroomCreate) => classroomsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() });
      toast.success('Derslik başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Derslik eklenirken bir hata oluştu');
    },
  });
}

/**
 * Update existing classroom
 */
export function useUpdateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClassroomCreate }) =>
      classroomsApi.update(id, data),
    onSuccess: (updatedClassroom, variables) => {
      queryClient.setQueryData(
        classroomKeys.detail(variables.id),
        updatedClassroom
      );
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() });
      queryClient.invalidateQueries({ queryKey: classroomKeys.schedule(variables.id) });
      toast.success('Derslik başarıyla güncellendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Derslik güncellenirken bir hata oluştu');
    },
  });
}

/**
 * Delete classroom
 */
export function useDeleteClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => classroomsApi.delete(id),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: classroomKeys.lists() });
      const previousClassrooms = queryClient.getQueriesData({ queryKey: classroomKeys.lists() });
      
      queryClient.setQueriesData(
        { queryKey: classroomKeys.lists() },
        (old: any) => old ? old.filter((classroom: any) => classroom.id !== deletedId) : []
      );
      
      return { previousClassrooms };
    },
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: classroomKeys.detail(deletedId) });
      queryClient.removeQueries({ queryKey: classroomKeys.schedule(deletedId) });
      toast.success('Derslik başarıyla silindi');
    },
    onError: (error: Error, _, context) => {
      if (context?.previousClassrooms) {
        context.previousClassrooms.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Derslik silinirken bir hata oluştu');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: classroomKeys.lists() });
    },
  });
}

/**
 * Prefetch classrooms
 */
export function usePrefetchClassrooms() {
  const queryClient = useQueryClient();

  return (filters?: FilterOptions) => {
    queryClient.prefetchQuery({
      queryKey: classroomKeys.list(filters),
      queryFn: () => classroomsApi.getAll(filters),
      staleTime: 10 * 60 * 1000,
    });
  };
}

/**
 * Prefetch single classroom
 */
export function usePrefetchClassroom() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: classroomKeys.detail(id),
      queryFn: () => classroomsApi.getById(id),
      staleTime: 10 * 60 * 1000,
    });
  };
}
