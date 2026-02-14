import { describe, it, expect } from 'vitest';
import { ConflictIndex } from '@/lib/scheduler/conflict-index';
import type { CourseData, ScheduleItem } from '@/lib/scheduler/types';

// Helper to create a mock course
function createCourse(overrides: Partial<CourseData> = {}): CourseData {
  return {
    id: 1,
    name: 'Test Course',
    code: 'TST101',
    teacherId: 1,
    faculty: 'muhendislik',
    level: '1',
    category: 'zorunlu',
    semester: 'Güz',
    totalHours: 4,
    capacityMargin: 0,
    sessions: [{ type: 'teorik', hours: 3 }],
    departments: [{ department: 'bilgisayar', studentCount: 60 }],
    teacherWorkingHours: {},
    hardcodedSchedules: [],
    ...overrides,
  };
}

// Helper to create a schedule item
function createScheduleItem(overrides: Partial<ScheduleItem> = {}): ScheduleItem {
  return {
    courseId: 1,
    classroomId: 1,
    day: 'Pazartesi',
    timeRange: '09:00-10:00',
    sessionType: 'teorik',
    sessionHours: 1,
    isHardcoded: false,
    ...overrides,
  };
}

describe('ConflictIndex', () => {
  describe('constructor', () => {
    it('should initialize with courses', () => {
      const courses = [createCourse({ id: 1 }), createCourse({ id: 2 })];
      const index = new ConflictIndex(courses);
      expect(index).toBeDefined();
    });

    it('should initialize with empty courses', () => {
      const index = new ConflictIndex([]);
      expect(index).toBeDefined();
    });
  });

  describe('addScheduleItem', () => {
    it('should add item without error', () => {
      const courses = [createCourse({ id: 1, teacherId: 1 })];
      const index = new ConflictIndex(courses);
      const item = createScheduleItem({ courseId: 1 });
      expect(() => index.addScheduleItem(item)).not.toThrow();
    });
  });

  describe('hasTeacherConflict', () => {
    it('should detect teacher conflict', () => {
      const courses = [
        createCourse({ id: 1, teacherId: 1 }),
        createCourse({ id: 2, teacherId: 1 }),
      ];
      const index = new ConflictIndex(courses);

      // Schedule course 1 on Monday 09:00-10:00
      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      // Teacher 1 should now have a conflict at the same time
      expect(index.hasTeacherConflict(1, 'Pazartesi', '09:00-10:00')).toBe(true);
    });

    it('should not detect conflict at different time', () => {
      const courses = [createCourse({ id: 1, teacherId: 1 })];
      const index = new ConflictIndex(courses);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      expect(index.hasTeacherConflict(1, 'Pazartesi', '10:00-11:00')).toBe(false);
    });

    it('should not detect conflict for different teacher', () => {
      const courses = [createCourse({ id: 1, teacherId: 1 })];
      const index = new ConflictIndex(courses);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      expect(index.hasTeacherConflict(2, 'Pazartesi', '09:00-10:00')).toBe(false);
    });

    it('should return false for null teacherId', () => {
      const index = new ConflictIndex([]);
      expect(index.hasTeacherConflict(null, 'Pazartesi', '09:00-10:00')).toBe(false);
    });
  });

  describe('hasClassroomConflict', () => {
    it('should detect classroom conflict', () => {
      const courses = [createCourse({ id: 1 })];
      const index = new ConflictIndex(courses);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        classroomId: 5,
        day: 'Salı',
        timeRange: '14:00-15:00',
      }));

      expect(index.hasClassroomConflict(5, 'Salı', '14:00-15:00')).toBe(true);
    });

    it('should not detect conflict for different classroom', () => {
      const courses = [createCourse({ id: 1 })];
      const index = new ConflictIndex(courses);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        classroomId: 5,
        day: 'Salı',
        timeRange: '14:00-15:00',
      }));

      expect(index.hasClassroomConflict(6, 'Salı', '14:00-15:00')).toBe(false);
    });
  });

  describe('hasDepartmentConflict', () => {
    it('should detect department conflict for compulsory courses', () => {
      const course1 = createCourse({
        id: 1,
        category: 'zorunlu',
        semester: 'Güz',
        level: '1',
        departments: [{ department: 'bilgisayar', studentCount: 60 }],
      });
      const course2 = createCourse({
        id: 2,
        category: 'zorunlu',
        semester: 'Güz',
        level: '1',
        departments: [{ department: 'bilgisayar', studentCount: 60 }],
      });

      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      expect(index.hasDepartmentConflict(course2, 'Pazartesi', '09:00-10:00')).toBe(true);
    });

    it('should not detect conflict for elective courses', () => {
      const course = createCourse({ id: 1, category: 'secmeli' });
      const index = new ConflictIndex([course]);

      expect(index.hasDepartmentConflict(course, 'Pazartesi', '09:00-10:00')).toBe(false);
    });

    it('should not detect conflict for different semesters', () => {
      const course1 = createCourse({
        id: 1,
        category: 'zorunlu',
        semester: 'Güz',
        level: '1',
        departments: [{ department: 'bilgisayar', studentCount: 60 }],
      });
      const course2 = createCourse({
        id: 2,
        category: 'zorunlu',
        semester: 'Bahar',
        level: '1',
        departments: [{ department: 'bilgisayar', studentCount: 60 }],
      });

      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      expect(index.hasDepartmentConflict(course2, 'Pazartesi', '09:00-10:00')).toBe(false);
    });

    it('should not detect conflict for different departments', () => {
      const course1 = createCourse({
        id: 1,
        category: 'zorunlu',
        semester: 'Güz',
        level: '1',
        departments: [{ department: 'bilgisayar', studentCount: 60 }],
      });
      const course2 = createCourse({
        id: 2,
        category: 'zorunlu',
        semester: 'Güz',
        level: '1',
        departments: [{ department: 'elektrik', studentCount: 40 }],
      });

      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      expect(index.hasDepartmentConflict(course2, 'Pazartesi', '09:00-10:00')).toBe(false);
    });
  });

  describe('checkConflicts', () => {
    it('should return null when no conflicts', () => {
      const course = createCourse({ id: 1, teacherId: 1 });
      const index = new ConflictIndex([course]);

      const result = index.checkConflicts(1, 1, 'Pazartesi', '09:00-10:00');
      expect(result).toBeNull();
    });

    it('should return teacher conflict reason', () => {
      const course1 = createCourse({ id: 1, teacherId: 1 });
      const course2 = createCourse({ id: 2, teacherId: 1 });
      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        classroomId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      const result = index.checkConflicts(2, 2, 'Pazartesi', '09:00-10:00');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('teacher');
      expect(result?.message).toContain('çakışması');
    });

    it('should return classroom conflict reason', () => {
      const course1 = createCourse({ id: 1, teacherId: 1 });
      const course2 = createCourse({ id: 2, teacherId: 2 });
      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        classroomId: 5,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      const result = index.checkConflicts(2, 5, 'Pazartesi', '09:00-10:00');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('classroom');
    });

    it('should cache conflict results', () => {
      const course = createCourse({ id: 1, teacherId: 1 });
      const index = new ConflictIndex([course]);

      // Call twice with same params
      const result1 = index.checkConflicts(1, 1, 'Pazartesi', '09:00-10:00');
      const result2 = index.checkConflicts(1, 1, 'Pazartesi', '09:00-10:00');

      expect(result1).toEqual(result2);
    });

    it('should handle day name normalization', () => {
      const course1 = createCourse({ id: 1, teacherId: 1 });
      const course2 = createCourse({ id: 2, teacherId: 1 });
      const index = new ConflictIndex([course1, course2]);

      index.addScheduleItem(createScheduleItem({
        courseId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      }));

      // Check with different day format
      const result = index.checkConflicts(2, 2, 'monday', '09:00-10:00');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('teacher');
    });
  });

  describe('removeScheduleItem', () => {
    it('should remove item and clear conflict', () => {
      const course1 = createCourse({ id: 1, teacherId: 1 });
      const course2 = createCourse({ id: 2, teacherId: 1 });
      const index = new ConflictIndex([course1, course2]);

      const item = createScheduleItem({
        courseId: 1,
        classroomId: 1,
        day: 'Pazartesi',
        timeRange: '09:00-10:00',
      });

      index.addScheduleItem(item);
      expect(index.hasTeacherConflict(1, 'Pazartesi', '09:00-10:00')).toBe(true);

      index.removeScheduleItem(item);
      expect(index.hasTeacherConflict(1, 'Pazartesi', '09:00-10:00')).toBe(false);
    });
  });
});
