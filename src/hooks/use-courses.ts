'use client';

/**
 * Course Hooks - React Query based
 * Manages course data fetching, mutations, and cache
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { coursesApi } from '@/lib/api';
import type { Course, CourseCreate, FilterOptions } from '@/types';

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters?: FilterOptions) => [...courseKeys.lists(), { filters }] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: number) => [...courseKeys.details(), id] as const,
};

/**
 * Get all courses with optional filters
 */
export function useCourses(filters?: FilterOptions) {
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => coursesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single course by ID
 */
export function useCourse(id: number, enabled = true) {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => coursesApi.getById(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new course
 */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CourseCreate) => coursesApi.create(data),
    onSuccess: (newCourse) => {
      // Add optimistically to cache
      queryClient.setQueriesData(
        { queryKey: courseKeys.lists() },
        (old: any) => old ? [...old, newCourse] : [newCourse]
      );
      // Invalidate to refetch and ensure consistency
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Ders başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Ders eklenirken bir hata oluştu');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

/**
 * Update existing course
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CourseCreate }) =>
      coursesApi.update(id, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() });
      await queryClient.cancelQueries({ queryKey: courseKeys.detail(variables.id) });
      
      const previousDetail = queryClient.getQueryData(courseKeys.detail(variables.id));
      const previousLists = queryClient.getQueriesData({ queryKey: courseKeys.lists() });
      
      // Optimistically update detail
      queryClient.setQueryData(courseKeys.detail(variables.id), (old: any) => ({
        ...old,
        ...variables.data,
      }));
      
      // Optimistically update lists
      queryClient.setQueriesData(
        { queryKey: courseKeys.lists() },
        (old: any) => old ? old.map((course: any) => 
          course.id === variables.id ? { ...course, ...variables.data } : course
        ) : []
      );
      
      return { previousDetail, previousLists };
    },
    onSuccess: (updatedCourse, variables) => {
      queryClient.setQueryData(courseKeys.detail(variables.id), updatedCourse);
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Ders başarıyla güncellendi');
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(courseKeys.detail(variables.id), context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Ders güncellenirken bir hata oluştu');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

/**
 * Delete course
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => coursesApi.delete(id),
    onMutate: async (deletedId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: courseKeys.lists() });
      
      // Snapshot previous value for rollback
      const previousCourses = queryClient.getQueriesData({ queryKey: courseKeys.lists() });
      
      // Optimistically remove from cache
      queryClient.setQueriesData(
        { queryKey: courseKeys.lists() },
        (old: any) => old ? old.filter((course: any) => course.id !== deletedId) : []
      );
      
      return { previousCourses };
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: courseKeys.detail(deletedId) });
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success('Ders başarıyla silindi');
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousCourses) {
        context.previousCourses.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Ders silinirken bir hata oluştu');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
}

/**
 * Get hardcoded schedules for a course
 */
export function useCourseHardcodedSchedules(courseId: number, enabled = true) {
  return useQuery({
    queryKey: [...courseKeys.detail(courseId), 'hardcoded-schedules'],
    queryFn: () => coursesApi.getHardcodedSchedules(courseId),
    enabled: enabled && !!courseId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

/**
 * Create hardcoded schedule for course
 */
export function useCreateHardcodedSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: number; data: any }) =>
      coursesApi.addHardcodedSchedule(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...courseKeys.detail(variables.courseId), 'hardcoded-schedules'],
      });
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.courseId) });
      toast.success('Sabit program başarıyla eklendi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Sabit program eklenirken bir hata oluştu');
    },
  });
}

/**
 * Delete hardcoded schedule
 */
export function useDeleteHardcodedSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, scheduleId }: { courseId: number; scheduleId: number }) =>
      coursesApi.removeHardcodedSchedule(courseId, scheduleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...courseKeys.detail(variables.courseId), 'hardcoded-schedules'],
      });
      toast.success('Sabit program başarıyla silindi');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Sabit program silinirken bir hata oluştu');
    },
  });
}

/**
 * Prefetch courses (useful for hover states, navigation)
 */
export function usePrefetchCourses() {
  const queryClient = useQueryClient();

  return (filters?: FilterOptions) => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.list(filters),
      queryFn: () => coursesApi.getAll(filters),
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Prefetch single course
 */
export function usePrefetchCourse() {
  const queryClient = useQueryClient();

  return (id: number) => {
    queryClient.prefetchQuery({
      queryKey: courseKeys.detail(id),
      queryFn: () => coursesApi.getById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
