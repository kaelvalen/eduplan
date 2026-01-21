// ==================== USER & AUTH ====================
export interface User {
  username: string;
  role: 'admin' | 'teacher';
  permissions: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// ==================== WORKING/AVAILABLE HOURS ====================
export interface AvailableHours {
  Pazartesi?: string[];
  Salı?: string[];
  Çarşamba?: string[];
  Perşembe?: string[];
  Cuma?: string[];
}

// Legacy support
export interface WorkingHours {
  monday: string[];
  tuesday: string[];
  wednesday: string[];
  thursday: string[];
  friday: string[];
}

// ==================== TEACHER ====================
export interface Teacher {
  id: number;
  name: string;
  email: string;
  title?: string; // Akademik ünvan (optional)
  faculty: string;
  department: string;
  working_hours?: string | null; // JSON string of AvailableHours (optional)
  is_active?: boolean;
}

export interface TeacherCreate {
  name: string;
  email: string;
  title: string;
  faculty: string;
  department: string;
  working_hours: string;
  is_active?: boolean;
}

export interface TeacherWithSchedule extends Teacher {
  schedule?: Schedule[];
}

// ==================== COURSE ====================
export interface CourseSession {
  id?: number;
  type: 'teorik' | 'lab' | 'tümü';
  hours: number;
}

export interface CourseDepartment {
  id?: number;
  department: string;
  student_count: number;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  teacher_id: number | null;
  faculty: string;
  level: string;
  type?: string;
  category: 'zorunlu' | 'secmeli';
  semester: string;
  ects: number;
  total_hours?: number;
  capacity_margin?: number; // Opsiyonel kapasite marjı (0-30%)
  is_active: boolean;
  student_count?: number;
  sessions: CourseSession[];
  departments: CourseDepartment[];
  hardcoded_schedules?: HardcodedSchedule[];
  teacher?: {
    id: number;
    name: string;
    title?: string;
    working_hours?: string | null;
  } | null;
}

export interface CourseCreate {
  name: string;
  code: string;
  teacher_id: number | null;
  faculty: string;
  level: string;
  category: 'zorunlu' | 'secmeli';
  semester: string;
  ects: number;
  capacity_margin?: number;
  is_active: boolean;
  sessions: Omit<CourseSession, 'id'>[];
  departments: Omit<CourseDepartment, 'id'>[];
}

// ==================== CLASSROOM ====================
export interface Classroom {
  id: number;
  name: string;
  capacity: number;
  type: 'teorik' | 'lab' | 'hibrit';
  faculty: string;
  department: string;
  priority_dept?: string; // Öncelikli bölüm kodu
  available_hours?: string | null; // JSON string of AvailableHours
  is_active?: boolean;
}

export interface ClassroomCreate {
  name: string;
  capacity: number;
  type: 'teorik' | 'lab' | 'hibrit';
  faculty: string;
  department: string;
  priority_dept?: string;
  available_hours?: string;
  is_active?: boolean;
}

export interface ClassroomWithSchedule extends Classroom {
  schedule?: Schedule[];
}

// ==================== HARDCODED SCHEDULE ====================
export interface HardcodedSchedule {
  id: number;
  course_id: number;
  session_type: 'teorik' | 'lab';
  day: string;
  start_time: string;
  end_time: string;
  classroom_id?: number;
  classroom?: {
    id: number;
    name: string;
  } | null;
}

export interface HardcodedScheduleCreate {
  course_id: number;
  session_type: 'teorik' | 'lab';
  day: string;
  start_time: string;
  end_time: string;
  classroom_id?: number;
}

// ==================== SCHEDULE ====================
export interface Schedule {
  id: number;
  day: string;
  time_range: string;
  course_id?: number;
  classroom_id?: number;
  is_hardcoded?: boolean;
  session_type?: string;
  course?: {
    id: number;
    name: string;
    code: string;
    teacher_id: number;
    faculty: string;
    level: string;
    category: 'zorunlu' | 'secmeli';
    semester: string;
    ects: number;
    is_active: boolean;
    teacher?: {
      id: number;
      name: string;
      title?: string;
      email: string;
      faculty: string;
      department: string;
      working_hours?: string | null;
    } | null;
    total_hours?: number;
    student_count?: number;
    departments: Array<{ id?: number; department: string; student_count: number }>;
    sessions: Array<{ id?: number; type: 'teorik' | 'lab' | 'tümü'; hours: number }>;
  } | null;
  classroom?: {
    id: number;
    name: string;
    type: 'teorik' | 'lab' | 'hibrit';
    capacity: number;
    faculty: string;
    department: string;
    available_hours?: string | null;
  } | null;
}

export interface ScheduleCreate {
  day: string;
  time_range: string;
  course_id: number;
  classroom_id: number;
  is_hardcoded?: boolean;
  session_type?: string;
}

// ==================== SCHEDULER ====================
export interface SchedulerStatus {
  total_active_courses: number;
  total_active_sessions: number;
  scheduled_sessions: number;
  completion_percentage: number;
}

export interface SchedulerResult {
  success: boolean;
  message: string;
  scheduled_count: number;
  unscheduled_count: number;
  success_rate: number;
  schedule: Schedule[];
  unscheduled: {
    id: number;
    name: string;
    code: string;
    total_hours: number;
    student_count: number;
    reason: string;
  }[];
  perfect: boolean;
}

// ==================== SYSTEM SETTINGS ====================
export interface SystemSettings {
  id: number;
  capacity_margin_enabled: boolean;
  capacity_margin_percent: number;
  // Time configuration
  slot_duration: number;
  day_start: string;
  day_end: string;
  lunch_break_start: string;
  lunch_break_end: string;
}

// ==================== STATISTICS ====================
export interface Statistics {
  teacherCount: number;
  courseCount: number;
  classroomCount: number;
  scheduleCount: number;
}

// ==================== FACULTY & DEPARTMENT ====================
export interface Faculty {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
}

// ==================== FILTER OPTIONS ====================
export interface FilterOptions {
  isActive?: boolean | null;
  faculty?: string | null;
  department?: string | null;
  type?: string | null;
  searchTerm?: string;
}

// ==================== ACADEMIC TITLES ====================
export const ACADEMIC_TITLES = [
  'Prof. Dr.',
  'Doç. Dr.',
  'Dr. Öğr. Üyesi',
  'Öğr. Gör.',
  'Arş. Gör.',
] as const;

export type AcademicTitle = typeof ACADEMIC_TITLES[number];

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'schedule' | 'teacher' | 'course' | 'classroom' | 'general';
  userId?: number;
  isRead: boolean;
  actionUrl?: string;
  data?: string; // JSON string
  createdAt: string;
  readAt?: string;
}

export interface NotificationCreate {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'schedule' | 'teacher' | 'course' | 'classroom' | 'general';
  userId?: number;
  actionUrl?: string;
  data?: string;
}

// ==================== DASHBOARD PREFERENCES ====================
export interface WidgetConfig {
  id: string;
  type: 'stats' | 'actions' | 'activity' | 'scheduler' | 'navigation';
  title?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  columns: number;
  gap: number;
  padding: number;
}

export interface UserDashboardPreference {
  id: number;
  userId: number;
  widgets: WidgetConfig[];
  layout: DashboardLayout;
  theme: 'default' | 'dark' | 'light' | 'auto';
  createdAt: string;
  updatedAt: string;
}

export interface UserDashboardPreferenceCreate {
  userId: number;
  widgets?: WidgetConfig[];
  layout?: DashboardLayout;
  theme?: 'default' | 'dark' | 'light' | 'auto';
}

// ==================== TIME BLOCKS ====================
// Re-exported from centralized time constants
export {
  TIME_SLOTS,
  TIME_BLOCKS,
  DAYS,
  DAYS_TR,
  DAYS_EN,
  DAY_MAPPING,
  type TimeSlot,
  type Day
} from '@/constants/time';

