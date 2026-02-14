import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getLearningDatabase,
  getLearningStats,
  clearLearningData,
  recordSchedulingAttempt,
  learnOptimalParameters,
} from '@/lib/scheduler/learning-system';
import { DEFAULT_SCHEDULER_CONFIG } from '@/lib/scheduler/config';
import type { CourseData, ClassroomData, ScheduleItem } from '@/lib/scheduler/types';

function mockCourse(id: number, studentCount = 60): CourseData {
  return {
    id, name: `Course ${id}`, code: `C${id}`, teacherId: id, faculty: 'eng',
    level: '1', category: 'zorunlu', semester: 'Güz', totalHours: 4,
    capacityMargin: 0, sessions: [{ type: 'teorik', hours: 3 }],
    departments: [{ department: 'cs', studentCount }],
    teacherWorkingHours: {}, hardcodedSchedules: [],
  };
}

function mockClassroom(id: number, capacity = 80): ClassroomData {
  return {
    id, name: `R${id}`, capacity, type: 'teorik',
    priorityDept: null, availableHours: {}, isActive: true,
  };
}

describe('Learning System', () => {
  beforeEach(() => {
    clearLearningData();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('LearningDatabase', () => {
    it('should start empty', () => {
      const stats = getLearningStats();
      expect(stats.totalRecords).toBe(0);
      expect(stats.avgSuccessRate).toBe(0);
    });

    it('should track records after recording', () => {
      const courses = [mockCourse(1), mockCourse(2)];
      const classrooms = [mockClassroom(1)];
      const schedule: ScheduleItem[] = [
        { courseId: 1, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00', sessionType: 'teorik', sessionHours: 1, isHardcoded: false },
      ];

      recordSchedulingAttempt(DEFAULT_SCHEDULER_CONFIG, courses, classrooms, schedule, 1000, {
        avg_capacity_margin: 20, max_capacity_waste: 30, teacher_load_stddev: 1.5,
      });

      const stats = getLearningStats();
      expect(stats.totalRecords).toBe(1);
      expect(stats.avgSuccessRate).toBeGreaterThan(0);
    });
  });

  describe('learnOptimalParameters', () => {
    it('should return null with insufficient data', () => {
      const result = learnOptimalParameters([mockCourse(1)], [mockClassroom(1)]);
      expect(result).toBeNull();
    });

    it('should learn from historical data', () => {
      const courses = [mockCourse(1), mockCourse(2)];
      const classrooms = [mockClassroom(1)];

      // Record multiple successful attempts
      for (let i = 0; i < 5; i++) {
        const schedule: ScheduleItem[] = courses.map(c => ({
          courseId: c.id, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00',
          sessionType: 'teorik', sessionHours: 1, isHardcoded: false,
        }));

        recordSchedulingAttempt(DEFAULT_SCHEDULER_CONFIG, courses, classrooms, schedule, 1000, {
          avg_capacity_margin: 20, max_capacity_waste: 30, teacher_load_stddev: 1.5,
        });
      }

      const result = learnOptimalParameters(courses, classrooms);
      expect(result).not.toBeNull();
      expect(result!.difficulty).toBeDefined();
    });
  });

  describe('export/import', () => {
    it('should export and import data', () => {
      const db = getLearningDatabase();

      const courses = [mockCourse(1)];
      const classrooms = [mockClassroom(1)];
      recordSchedulingAttempt(DEFAULT_SCHEDULER_CONFIG, courses, classrooms, [], 500, {
        avg_capacity_margin: 10, max_capacity_waste: 20, teacher_load_stddev: 1,
      });

      const json = db.exportToJSON();
      expect(json).toContain('successRate');

      clearLearningData();
      expect(getLearningStats().totalRecords).toBe(0);

      db.importFromJSON(json);
      expect(getLearningStats().totalRecords).toBe(1);
    });

    it('should handle invalid JSON import', () => {
      const db = getLearningDatabase();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      db.importFromJSON('invalid json');
      expect(getLearningStats().totalRecords).toBe(0);
      errorSpy.mockRestore();
    });
  });
});
