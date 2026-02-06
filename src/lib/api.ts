import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  AuthResponse,
  User,
  Teacher,
  TeacherCreate,
  Course,
  CourseCreate,
  Classroom,
  ClassroomCreate,
  Schedule,
  ScheduleCreate,
  SchedulerStatus,
  SchedulerResult,
  Statistics,
  SystemSettings,
  HardcodedSchedule,
  HardcodedScheduleCreate,
  TeacherWithSchedule,
  ClassroomWithSchedule,
  FilterOptions,
  Notification,
  NotificationCreate,
  UserDashboardPreference,
  UserDashboardPreferenceCreate,
} from '@/types';

const API_URL = '/api';

// Axios instance with interceptors
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token to headers
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// ==================== AUTH ====================
export const authApi = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },
};

// ==================== TEACHERS ====================
export const teachersApi = {
  getAll: async (filters?: FilterOptions): Promise<Teacher[]> => {
    const params: Record<string, string> = {};
    if (filters?.isActive !== undefined && filters.isActive !== null) {
      params.isActive = String(filters.isActive);
    }
    if (filters?.faculty) {
      params.faculty = filters.faculty;
    }
    if (filters?.department) {
      params.department = filters.department;
    }
    if (filters?.searchTerm) {
      params.search = filters.searchTerm;
    }
    const response = await api.get<Teacher[]>('/teachers', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Teacher> => {
    const response = await api.get<Teacher>(`/teachers/${id}`);
    return response.data;
  },

  getSchedule: async (id: number): Promise<TeacherWithSchedule> => {
    const response = await api.get<TeacherWithSchedule>(`/teachers/${id}/schedule`);
    return response.data;
  },

  create: async (data: TeacherCreate): Promise<Teacher> => {
    const response = await api.post<Teacher>('/teachers', data);
    return response.data;
  },

  update: async (id: number, data: TeacherCreate): Promise<Teacher> => {
    const response = await api.put<Teacher>(`/teachers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/teachers/${id}`);
  },
};

// ==================== COURSES ====================
export const coursesApi = {
  getAll: async (filters?: FilterOptions): Promise<Course[]> => {
    const params: Record<string, string> = {};
    if (filters?.isActive !== undefined && filters.isActive !== null) {
      params.isActive = String(filters.isActive);
    }
    if (filters?.faculty) {
      params.faculty = filters.faculty;
    }
    if (filters?.department) {
      params.department = filters.department;
    }
    if (filters?.type) {
      params.type = filters.type;
    }
    if (filters?.searchTerm) {
      params.search = filters.searchTerm;
    }
    const response = await api.get<Course[]>('/courses', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Course> => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  create: async (data: CourseCreate): Promise<Course> => {
    const response = await api.post<Course>('/courses', data);
    return response.data;
  },

  update: async (id: number, data: CourseCreate): Promise<Course> => {
    const response = await api.put<Course>(`/courses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  // Hardcoded Schedules
  getHardcodedSchedules: async (id: number): Promise<HardcodedSchedule[]> => {
    const response = await api.get<HardcodedSchedule[]>(`/courses/${id}/hardcoded`);
    return response.data;
  },

  addHardcodedSchedule: async (id: number, data: Omit<HardcodedScheduleCreate, 'course_id'>): Promise<HardcodedSchedule> => {
    const response = await api.post<HardcodedSchedule>(`/courses/${id}/hardcoded`, data);
    return response.data;
  },

  removeHardcodedSchedule: async (courseId: number, scheduleId: number): Promise<void> => {
    await api.delete(`/courses/${courseId}/hardcoded?scheduleId=${scheduleId}`);
  },
};

// ==================== CLASSROOMS ====================
export const classroomsApi = {
  getAll: async (filters?: FilterOptions): Promise<Classroom[]> => {
    const params: Record<string, string> = {};
    if (filters?.isActive !== undefined && filters.isActive !== null) {
      params.isActive = String(filters.isActive);
    }
    if (filters?.faculty) {
      params.faculty = filters.faculty;
    }
    if (filters?.department) {
      params.department = filters.department;
    }
    if (filters?.type) {
      params.type = filters.type;
    }
    if (filters?.searchTerm) {
      params.search = filters.searchTerm;
    }
    const response = await api.get<Classroom[]>('/classrooms', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Classroom> => {
    const response = await api.get<Classroom>(`/classrooms/${id}`);
    return response.data;
  },

  getSchedule: async (id: number): Promise<ClassroomWithSchedule> => {
    const response = await api.get<ClassroomWithSchedule>(`/classrooms/${id}/schedule`);
    return response.data;
  },

  create: async (data: ClassroomCreate): Promise<Classroom> => {
    const response = await api.post<Classroom>('/classrooms', data);
    return response.data;
  },

  update: async (id: number, data: ClassroomCreate): Promise<Classroom> => {
    const response = await api.put<Classroom>(`/classrooms/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/classrooms/${id}`);
  },
};

// ==================== SCHEDULES ====================
export const schedulesApi = {
  getAll: async (): Promise<Schedule[]> => {
    const response = await api.get<Schedule[]>('/schedules');
    return response.data;
  },

  getById: async (id: number): Promise<Schedule> => {
    const response = await api.get<Schedule>(`/schedules/${id}`);
    return response.data;
  },

  create: async (data: ScheduleCreate): Promise<Schedule> => {
    const response = await api.post<Schedule>('/schedules', data);
    return response.data;
  },

  update: async (id: number, data: Partial<ScheduleCreate>): Promise<Schedule> => {
    const response = await api.put<Schedule>(`/schedules/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/schedules/${id}`);
  },

  deleteByDays: async (days: string[]): Promise<void> => {
    await api.post('/schedules/days/delete', { days });
  },
};

// ==================== SCHEDULER ====================
export const schedulerApi = {
  generate: async (): Promise<SchedulerResult> => {
    const response = await api.post<SchedulerResult>('/scheduler/generate');
    return response.data;
  },

  getStatus: async (): Promise<SchedulerStatus> => {
    const response = await api.get<SchedulerStatus>('/scheduler/status');
    return response.data;
  },
};

// ==================== SETTINGS ====================
export const settingsApi = {
  get: async (): Promise<SystemSettings> => {
    const response = await api.get<SystemSettings>('/settings');
    return response.data;
  },

  update: async (data: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await api.put<SystemSettings>('/settings', data);
    return response.data;
  },
};

// ==================== STATISTICS ====================
export const statisticsApi = {
  get: async (): Promise<Statistics> => {
    const response = await api.get<Statistics>('/statistics');
    return response.data;
  },
};

export const dashboardPreferencesApi = {
  get: async (): Promise<UserDashboardPreference> => {
    const response = await api.get<UserDashboardPreference>('/dashboard-preferences');
    return response.data;
  },
  update: async (data: Partial<UserDashboardPreferenceCreate>): Promise<UserDashboardPreference> => {
    const response = await api.put<UserDashboardPreference>('/dashboard-preferences', data);
    return response.data;
  },
};

export const notificationApi = {
  getAll: async (params?: { unreadOnly?: boolean; category?: string }): Promise<Notification[]> => {
    const response = await api.get<Notification[]>('/notifications', { params });
    return response.data;
  },
  getById: async (id: number): Promise<Notification> => {
    const response = await api.get<Notification>(`/notifications/${id}`);
    return response.data;
  },
  create: async (data: NotificationCreate): Promise<Notification> => {
    const response = await api.post<Notification>('/notifications', data);
    return response.data;
  },
  markAsRead: async (id: number): Promise<Notification> => {
    const response = await api.put<Notification>(`/notifications/${id}`);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};

export default api;

