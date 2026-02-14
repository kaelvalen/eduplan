import { describe, it, expect } from 'vitest';
import {
  analyzeProblemCharacteristics,
  calculateAdaptiveTimeout,
  adaptDifficultyWeights,
  adaptCapacityConstraints,
  adaptHillClimbingParams,
  createAdaptiveConfig,
} from '@/lib/scheduler/adaptive-config';
import { DEFAULT_SCHEDULER_CONFIG } from '@/lib/scheduler/config';
import type { CourseData, ClassroomData } from '@/lib/scheduler/types';

function mockCourse(overrides: Partial<CourseData> = {}): CourseData {
  return {
    id: 1, name: 'Test', code: 'TST101', teacherId: 1, faculty: 'eng',
    level: '1', category: 'zorunlu', semester: 'Güz', totalHours: 4,
    capacityMargin: 0, sessions: [{ type: 'teorik', hours: 3 }],
    departments: [{ department: 'cs', studentCount: 60 }],
    teacherWorkingHours: {}, hardcodedSchedules: [],
    ...overrides,
  };
}

function mockClassroom(overrides: Partial<ClassroomData> = {}): ClassroomData {
  return {
    id: 1, name: 'A101', capacity: 80, type: 'teorik',
    priorityDept: null, availableHours: {}, isActive: true,
    ...overrides,
  };
}

describe('Adaptive Config', () => {
  describe('analyzeProblemCharacteristics', () => {
    it('should analyze course and classroom data', () => {
      const courses = [
        mockCourse({ id: 1, teacherId: 1 }),
        mockCourse({ id: 2, teacherId: 2 }),
      ];
      const classrooms = [mockClassroom({ capacity: 100 })];

      const chars = analyzeProblemCharacteristics(courses, classrooms);

      expect(chars.courseCount).toBe(2);
      expect(chars.classroomCount).toBe(1);
      expect(chars.teacherCount).toBe(2);
      expect(chars.totalStudents).toBe(120);
      expect(chars.avgStudentsPerCourse).toBe(60);
      expect(chars.hasLabCourses).toBe(false);
    });

    it('should detect lab courses', () => {
      const courses = [mockCourse({ sessions: [{ type: 'lab', hours: 2 }] })];
      const chars = analyzeProblemCharacteristics(courses, [mockClassroom()]);
      expect(chars.hasLabCourses).toBe(true);
    });

    it('should handle empty inputs', () => {
      const chars = analyzeProblemCharacteristics([], []);
      expect(chars.courseCount).toBe(0);
      expect(chars.avgStudentsPerCourse).toBe(0);
      expect(chars.teacherCount).toBe(0);
    });

    it('should calculate classroom utilization', () => {
      const courses = [mockCourse({ departments: [{ department: 'cs', studentCount: 80 }] })];
      const classrooms = [mockClassroom({ capacity: 100 })];
      const chars = analyzeProblemCharacteristics(courses, classrooms);
      expect(chars.classroomUtilization).toBe(0.8);
    });
  });

  describe('calculateAdaptiveTimeout', () => {
    it('should increase timeout for more courses', () => {
      const small = calculateAdaptiveTimeout({ courseCount: 5, classroomCount: 5, avgStudentsPerCourse: 50, totalStudents: 250, classroomUtilization: 0.5, teacherCount: 5, avgCoursesPerTeacher: 1, hasLabCourses: false, avgSessionDuration: 2 });
      const large = calculateAdaptiveTimeout({ courseCount: 50, classroomCount: 5, avgStudentsPerCourse: 50, totalStudents: 2500, classroomUtilization: 0.5, teacherCount: 20, avgCoursesPerTeacher: 2.5, hasLabCourses: false, avgSessionDuration: 2 });

      expect(large).toBeGreaterThan(small);
    });

    it('should increase for lab courses', () => {
      const noLab = calculateAdaptiveTimeout({ courseCount: 20, classroomCount: 10, avgStudentsPerCourse: 50, totalStudents: 1000, classroomUtilization: 0.5, teacherCount: 10, avgCoursesPerTeacher: 2, hasLabCourses: false, avgSessionDuration: 2 });
      const withLab = calculateAdaptiveTimeout({ courseCount: 20, classroomCount: 10, avgStudentsPerCourse: 50, totalStudents: 1000, classroomUtilization: 0.5, teacherCount: 10, avgCoursesPerTeacher: 2, hasLabCourses: true, avgSessionDuration: 2 });

      expect(withLab).toBeGreaterThan(noLab);
    });

    it('should cap at 5 minutes', () => {
      const timeout = calculateAdaptiveTimeout({ courseCount: 10000, classroomCount: 1, avgStudentsPerCourse: 100, totalStudents: 1000000, classroomUtilization: 1, teacherCount: 100, avgCoursesPerTeacher: 100, hasLabCourses: true, avgSessionDuration: 5 });
      expect(timeout).toBeLessThanOrEqual(300000);
    });
  });

  describe('adaptDifficultyWeights', () => {
    it('should increase scarcity weight for high utilization', () => {
      const chars = { courseCount: 20, classroomCount: 5, avgStudentsPerCourse: 50, totalStudents: 1000, classroomUtilization: 0.95, teacherCount: 10, avgCoursesPerTeacher: 2, hasLabCourses: false, avgSessionDuration: 2 };
      const weights = adaptDifficultyWeights(chars, DEFAULT_SCHEDULER_CONFIG);
      expect(weights.classroomScarcityFactor).toBeGreaterThan(DEFAULT_SCHEDULER_CONFIG.difficulty.classroomScarcityFactor);
    });

    it('should decrease scarcity weight for low utilization', () => {
      const chars = { courseCount: 5, classroomCount: 50, avgStudentsPerCourse: 20, totalStudents: 100, classroomUtilization: 0.3, teacherCount: 5, avgCoursesPerTeacher: 1, hasLabCourses: false, avgSessionDuration: 2 };
      const weights = adaptDifficultyWeights(chars, DEFAULT_SCHEDULER_CONFIG);
      expect(weights.classroomScarcityFactor).toBeLessThan(DEFAULT_SCHEDULER_CONFIG.difficulty.classroomScarcityFactor);
    });

    it('should increase student weight for large classes', () => {
      const chars = { courseCount: 10, classroomCount: 10, avgStudentsPerCourse: 150, totalStudents: 1500, classroomUtilization: 0.7, teacherCount: 10, avgCoursesPerTeacher: 1, hasLabCourses: false, avgSessionDuration: 2 };
      const weights = adaptDifficultyWeights(chars, DEFAULT_SCHEDULER_CONFIG);
      expect(weights.studentWeightFactor).toBeGreaterThan(DEFAULT_SCHEDULER_CONFIG.difficulty.studentWeightFactor);
    });
  });

  describe('adaptCapacityConstraints', () => {
    it('should tighten range for high capacity waste', () => {
      const metrics = { currentScheduledCount: 10, currentUnscheduledCount: 0, avgCapacityWaste: 50, teacherLoadVariance: 2, classroomScarcity: 0.3, conflictRate: 0.1 };
      const capacity = adaptCapacityConstraints(metrics, DEFAULT_SCHEDULER_CONFIG);
      expect(capacity.idealMinRatio).toBeGreaterThanOrEqual(DEFAULT_SCHEDULER_CONFIG.capacity.idealMinRatio);
    });

    it('should loosen constraints for scarce classrooms', () => {
      const metrics = { currentScheduledCount: 10, currentUnscheduledCount: 5, avgCapacityWaste: 10, teacherLoadVariance: 2, classroomScarcity: 0.9, conflictRate: 0.5 };
      const capacity = adaptCapacityConstraints(metrics, DEFAULT_SCHEDULER_CONFIG);
      expect(capacity.idealMinRatio).toBeLessThanOrEqual(DEFAULT_SCHEDULER_CONFIG.capacity.idealMinRatio);
    });
  });

  describe('adaptHillClimbingParams', () => {
    it('should increase iterations for high teacher load variance', () => {
      const metrics = { currentScheduledCount: 20, currentUnscheduledCount: 0, avgCapacityWaste: 10, teacherLoadVariance: 10, classroomScarcity: 0.3, conflictRate: 0.1 };
      const params = adaptHillClimbingParams(metrics, DEFAULT_SCHEDULER_CONFIG);
      expect(params.iterations).toBeGreaterThan(DEFAULT_SCHEDULER_CONFIG.hillClimbing.iterations);
    });

    it('should reduce iterations for low success rate', () => {
      const metrics = { currentScheduledCount: 5, currentUnscheduledCount: 15, avgCapacityWaste: 10, teacherLoadVariance: 2, classroomScarcity: 0.5, conflictRate: 0.5 };
      const params = adaptHillClimbingParams(metrics, DEFAULT_SCHEDULER_CONFIG);
      expect(params.iterations).toBeLessThan(DEFAULT_SCHEDULER_CONFIG.hillClimbing.iterations);
    });
  });

  describe('createAdaptiveConfig', () => {
    it('should return a complete config', () => {
      const courses = [mockCourse()];
      const classrooms = [mockClassroom()];
      const config = createAdaptiveConfig(courses, classrooms, DEFAULT_SCHEDULER_CONFIG);
      expect(config.difficulty).toBeDefined();
      expect(config.performance).toBeDefined();
      expect(config.features).toBeDefined();
    });

    it('should apply runtime metrics when provided', () => {
      const courses = [mockCourse()];
      const classrooms = [mockClassroom()];
      const metrics = { currentScheduledCount: 10, currentUnscheduledCount: 0, avgCapacityWaste: 50, teacherLoadVariance: 8, classroomScarcity: 0.3, conflictRate: 0.1 };
      const config = createAdaptiveConfig(courses, classrooms, DEFAULT_SCHEDULER_CONFIG, metrics);
      expect(config.capacity).toBeDefined();
      expect(config.hillClimbing).toBeDefined();
    });
  });
});
