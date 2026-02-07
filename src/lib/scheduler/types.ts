/**
 * Scheduler Types
 * Type definitions for the scheduling system
 */

export interface TimeBlock {
  start: string;
  end: string;
}

export interface TimeSettings {
  slotDuration: number;
  dayStart: string;
  dayEnd: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
}

export interface ScheduleItem {
  courseId: number;
  classroomId: number;
  day: string;
  timeRange: string;
  sessionType: string;
  sessionHours: number;
  isHardcoded: boolean;
}

export interface SessionData {
  type: string;
  hours: number;
}

export interface DepartmentData {
  department: string;
  studentCount: number;
}

export interface CourseData {
  id: number;
  name: string;
  code: string;
  teacherId: number | null;
  faculty: string;
  level: string;
  category: string; // "zorunlu" | "secmeli"
  semester: string;
  totalHours: number;
  capacityMargin: number;
  sessions: SessionData[];
  departments: DepartmentData[];
  teacherWorkingHours: Record<string, string[]>;
  hardcodedSchedules: HardcodedScheduleData[];
}

export interface HardcodedScheduleData {
  day: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  classroomId: number | null;
}

export interface ClassroomData {
  id: number;
  name: string;
  capacity: number;
  type: string;
  priorityDept: string | null;
  availableHours: Record<string, string[]>;
  isActive: boolean;
}

export interface SchedulerConfig {
  courses: CourseData[];
  classrooms: ClassroomData[];
  timeBlocks: TimeBlock[];
}

export interface SchedulerProgress {
  stage: 'initializing' | 'hardcoded' | 'scheduling' | 'optimizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentCourse?: string;
  scheduledCount?: number;
  totalCourses?: number;
}

export interface SchedulerResult {
  success: boolean;
  message: string;
  scheduled_count: number;
  unscheduled_count: number;
  success_rate: number;
  schedule: ScheduleItem[];
  unscheduled: UnscheduledCourse[];
  perfect: boolean;
  metrics: SchedulerMetrics;
  duration: number;
}

export interface UnscheduledCourse {
  id: number;
  name: string;
  code: string;
  total_hours: number;
  student_count: number;
  reason: string;
}

export interface SchedulerMetrics {
  avg_capacity_margin: number;
  max_capacity_waste: number;
  teacher_load_stddev: number;
}

export interface ConflictReason {
  type: 'teacher' | 'classroom' | 'department' | 'capacity' | 'availability';
  message: string;
  details?: Record<string, any>;
}

export interface PlacementAttempt {
  courseId: number;
  sessionType: string;
  day: string;
  timeRange: string;
  success: boolean;
  reason?: ConflictReason;
}
