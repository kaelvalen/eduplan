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
  seed?: number; // Optional seed for deterministic random number generation
  timeoutMs?: number; // Optional timeout in milliseconds (default: 60000)
  features?: {
    enableSessionSplitting?: boolean;
    enableCombinedTheoryLab?: boolean;
    enableBacktracking?: boolean;
    enableSimulatedAnnealing?: boolean;
    enableAdaptiveConfig?: boolean;
    enableLearning?: boolean;
  };
}

export interface SchedulerProgress {
  stage: 'initializing' | 'hardcoded' | 'scheduling' | 'optimizing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentCourse?: string;
  scheduledCount?: number;
  totalCourses?: number;
  coursesProcessed?: number;
  estimatedTimeRemaining?: number;
  warnings?: string[];
  startTime?: number;
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
  diagnostics?: CourseFailureDiagnostic[];
}

export interface UnscheduledCourse {
  id: number;
  name: string;
  code: string;
  total_hours: number;
  student_count: number;
  reason: string;
}

/**
 * Detailed failure diagnostic for a course that couldn't be scheduled
 */
export interface CourseFailureDiagnostic {
  courseId: number;
  courseName: string;
  courseCode: string;
  totalHours: number;
  studentCount: number;
  faculty: string;
  level: string;
  semester: string;
  teacherId: number | null;
  departments: DepartmentData[];
  failedSessions: SessionFailureDiagnostic[];
}

/**
 * Diagnostic for a session that couldn't be placed
 */
export interface SessionFailureDiagnostic {
  sessionType: string;
  sessionHours: number;
  attemptedDays: DayAttemptDiagnostic[];
  splitAttempted: boolean;
  splitSucceeded: boolean;
  combinedTheoryLabAttempted: boolean;
}

/**
 * Diagnostic for a specific day attempt
 */
export interface DayAttemptDiagnostic {
  day: string;
  attemptedTimeSlots: TimeSlotAttemptDiagnostic[];
}

/**
 * Diagnostic for a specific time slot attempt
 */
export interface TimeSlotAttemptDiagnostic {
  timeRange: string;
  failureReason: {
    type: 'teacher_unavailable' | 'teacher_conflict' | 'department_conflict' | 'no_classroom' | 'insufficient_blocks' | 'already_scheduled_today' | 'classroom_capacity' | 'classroom_type' | 'classroom_unavailable';
    message: string;
    details?: {
      requiredCapacity?: number;
      availableClassrooms?: number;
      teacherAvailableHours?: string[];
      conflictingCourses?: { id: number; code: string; name: string }[];
      conflictingDepartments?: string[];
      requiredType?: string;
      maxCapacity?: number;
    };
  };
}

export interface SchedulerMetrics {
  avg_capacity_margin: number;
  max_capacity_waste: number;
  teacher_load_stddev: number;
}

export interface ConflictReason {
  type: 'teacher' | 'classroom' | 'department' | 'capacity' | 'availability';
  message: string;
  details?: {
    requiredCapacity?: number;
    availableClassrooms?: number;
    teacherAvailableHours?: string[];
    conflictingCourses?: { id: number; code: string; name: string }[];
    conflictingDepartments?: string[];
    requiredType?: string;
    maxCapacity?: number;
  };
}

export interface PlacementAttempt {
  courseId: number;
  sessionType: string;
  day: string;
  timeRange: string;
  success: boolean;
  reason?: ConflictReason;
}
