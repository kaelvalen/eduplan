import { describe, it, expect } from 'vitest';
import {
  isTeacherAvailable,
  isClassroomAvailable,
  hasConflict,
  calculateCourseDifficulty,
  findSuitableClassroomForBlocks,
  resetClassroomCache,
  getClassroomCacheStats,
} from '@/lib/scheduler/constraints';
import type { TimeBlock, CourseData, ClassroomData, ScheduleItem } from '@/lib/scheduler/types';

function block(start: string, end: string): TimeBlock {
  return { start, end };
}

describe('Scheduler Constraints', () => {
  describe('isTeacherAvailable', () => {
    it('should return true when no config set', () => {
      expect(isTeacherAvailable({}, 'Pazartesi', block('09:00', '10:00'))).toBe(true);
    });

    it('should return true when all arrays empty', () => {
      expect(isTeacherAvailable({ Pazartesi: [], Salı: [] }, 'Pazartesi', block('09:00', '10:00'))).toBe(true);
    });

    it('should return true when slot matches', () => {
      const wh = { Pazartesi: ['09:00-10:00', '10:00-11:00'], Salı: ['09:00-10:00'] };
      expect(isTeacherAvailable(wh, 'Pazartesi', block('09:00', '10:00'))).toBe(true);
    });

    it('should return false when slot does not match', () => {
      const wh = { Pazartesi: ['09:00-10:00'], Salı: ['09:00-10:00'] };
      expect(isTeacherAvailable(wh, 'Pazartesi', block('14:00', '15:00'))).toBe(false);
    });

    it('should return false when day has no slots but config exists', () => {
      const wh = { Pazartesi: ['09:00-10:00'], Salı: [] };
      expect(isTeacherAvailable(wh, 'Salı', block('09:00', '10:00'))).toBe(false);
    });

    it('should handle day name normalization', () => {
      const wh = { Pazartesi: ['09:00-10:00'] };
      expect(isTeacherAvailable(wh, 'monday', block('09:00', '10:00'))).toBe(true);
    });
  });

  describe('isClassroomAvailable', () => {
    it('should return true when no config set', () => {
      expect(isClassroomAvailable({}, 'Pazartesi', block('09:00', '10:00'))).toBe(true);
    });

    it('should return true when slot matches', () => {
      const ah = { Pazartesi: ['09:00-10:00'] };
      expect(isClassroomAvailable(ah, 'Pazartesi', block('09:00', '10:00'))).toBe(true);
    });

    it('should return false when slot does not match', () => {
      const ah = { Pazartesi: ['09:00-10:00'] };
      expect(isClassroomAvailable(ah, 'Pazartesi', block('14:00', '15:00'))).toBe(false);
    });
  });

  describe('hasConflict', () => {
    const makeCourse = (id: number, teacherId: number, dept: string, cat = 'zorunlu', sem = 'Güz', lvl = '1'): CourseData => ({
      id, name: `Course ${id}`, code: `C${id}`, teacherId, faculty: 'eng',
      level: lvl, category: cat, semester: sem, totalHours: 4, capacityMargin: 0,
      sessions: [{ type: 'teorik', hours: 3 }],
      departments: [{ department: dept, studentCount: 60 }],
      teacherWorkingHours: {}, hardcodedSchedules: [],
    });

    it('should detect teacher conflict', () => {
      const courses = new Map<number, CourseData>();
      courses.set(1, makeCourse(1, 1, 'cs'));
      courses.set(2, makeCourse(2, 1, 'ee')); // same teacher

      const schedule: ScheduleItem[] = [{
        courseId: 1, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1, isHardcoded: false,
      }];

      expect(hasConflict(schedule, {
        courseId: 2, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1,
      }, courses)).toBe(true);
    });

    it('should detect compulsory course conflict (same dept, semester, level)', () => {
      const courses = new Map<number, CourseData>();
      courses.set(1, makeCourse(1, 1, 'cs', 'zorunlu', 'Güz', '1'));
      courses.set(2, makeCourse(2, 2, 'cs', 'zorunlu', 'Güz', '1'));

      const schedule: ScheduleItem[] = [{
        courseId: 1, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1, isHardcoded: false,
      }];

      expect(hasConflict(schedule, {
        courseId: 2, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1,
      }, courses)).toBe(true);
    });

    it('should not conflict for different days', () => {
      const courses = new Map<number, CourseData>();
      courses.set(1, makeCourse(1, 1, 'cs'));
      courses.set(2, makeCourse(2, 1, 'cs'));

      const schedule: ScheduleItem[] = [{
        courseId: 1, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1, isHardcoded: false,
      }];

      expect(hasConflict(schedule, {
        courseId: 2, day: 'Salı', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1,
      }, courses)).toBe(false);
    });

    it('should not conflict for elective courses in same dept', () => {
      const courses = new Map<number, CourseData>();
      courses.set(1, makeCourse(1, 1, 'cs', 'secmeli'));
      courses.set(2, makeCourse(2, 2, 'cs', 'secmeli'));

      const schedule: ScheduleItem[] = [{
        courseId: 1, classroomId: 1, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1, isHardcoded: false,
      }];

      expect(hasConflict(schedule, {
        courseId: 2, day: 'Pazartesi', timeRange: '09:00-10:00',
        sessionType: 'teorik', sessionHours: 1,
      }, courses)).toBe(false);
    });
  });

  describe('calculateCourseDifficulty', () => {
    it('should return higher difficulty for larger classes', () => {
      const small: CourseData = {
        id: 1, name: 'S', code: 'S1', teacherId: 1, faculty: 'eng',
        level: '1', category: 'zorunlu', semester: 'Güz', totalHours: 2,
        capacityMargin: 0, sessions: [{ type: 'teorik', hours: 2 }],
        departments: [{ department: 'cs', studentCount: 30 }],
        teacherWorkingHours: {}, hardcodedSchedules: [],
      };
      const large: CourseData = { ...small, id: 2, departments: [{ department: 'cs', studentCount: 200 }] };

      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A', capacity: 300, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
      ];

      expect(calculateCourseDifficulty(large, classrooms)).toBeGreaterThan(
        calculateCourseDifficulty(small, classrooms)
      );
    });

    it('should return higher difficulty for fewer available classrooms', () => {
      const course: CourseData = {
        id: 1, name: 'C', code: 'C1', teacherId: 1, faculty: 'eng',
        level: '1', category: 'zorunlu', semester: 'Güz', totalHours: 2,
        capacityMargin: 0, sessions: [{ type: 'lab', hours: 2 }],
        departments: [{ department: 'cs', studentCount: 50 }],
        teacherWorkingHours: {}, hardcodedSchedules: [],
      };

      const manyClassrooms: ClassroomData[] = Array.from({ length: 10 }, (_, i) => ({
        id: i, name: `L${i}`, capacity: 60, type: 'lab' as const,
        priorityDept: null, availableHours: {}, isActive: true,
      }));
      const fewClassrooms: ClassroomData[] = [manyClassrooms[0]];

      expect(calculateCourseDifficulty(course, fewClassrooms)).toBeGreaterThan(
        calculateCourseDifficulty(course, manyClassrooms)
      );
    });
  });

  describe('findSuitableClassroomForBlocks', () => {
    beforeEach(() => {
      resetClassroomCache();
    });

    it('should find a suitable classroom', () => {
      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A101', capacity: 80, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
      ];

      const result = findSuitableClassroomForBlocks(
        classrooms, 'teorik', 50, [new Set<number>()], 0, 'cs', 'Pazartesi',
        [block('09:00', '10:00')]
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
    });

    it('should return null when no classroom has enough capacity', () => {
      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A101', capacity: 20, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
      ];

      const result = findSuitableClassroomForBlocks(
        classrooms, 'teorik', 50, [new Set<number>()], 0, 'cs', 'Pazartesi',
        [block('09:00', '10:00')]
      );

      expect(result).toBeNull();
    });

    it('should skip occupied classrooms', () => {
      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A101', capacity: 80, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
        { id: 2, name: 'A102', capacity: 80, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
      ];

      const occupied = new Set<number>([1]);
      const result = findSuitableClassroomForBlocks(
        classrooms, 'teorik', 50, [occupied], 0, 'cs', 'Pazartesi',
        [block('09:00', '10:00')]
      );

      expect(result).not.toBeNull();
      expect(result!.id).toBe(2);
    });

    it('should match lab type for lab sessions', () => {
      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A101', capacity: 80, type: 'teorik', priorityDept: null, availableHours: {}, isActive: true },
        { id: 2, name: 'L101', capacity: 60, type: 'lab', priorityDept: null, availableHours: {}, isActive: true },
      ];

      const result = findSuitableClassroomForBlocks(
        classrooms, 'lab', 40, [new Set<number>()], 0, 'cs', 'Pazartesi',
        [block('09:00', '10:00')]
      );

      expect(result).not.toBeNull();
      expect(result!.type).toBe('lab');
    });

    it('should skip inactive classrooms', () => {
      const classrooms: ClassroomData[] = [
        { id: 1, name: 'A101', capacity: 80, type: 'teorik', priorityDept: null, availableHours: {}, isActive: false },
      ];

      const result = findSuitableClassroomForBlocks(
        classrooms, 'teorik', 50, [new Set<number>()], 0, 'cs', 'Pazartesi',
        [block('09:00', '10:00')]
      );

      expect(result).toBeNull();
    });
  });

  describe('classroom cache', () => {
    it('should track cache stats', () => {
      resetClassroomCache();
      const stats = getClassroomCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });
});
