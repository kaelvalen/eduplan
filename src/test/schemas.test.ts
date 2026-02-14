import { describe, it, expect } from 'vitest';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateTeacherSchema,
  UpdateTeacherSchema,
  CreateClassroomSchema,
  AvailableHoursSchema,
  CourseSessionSchema,
  CourseDepartmentSchema,
} from '@/lib/schemas';

describe('Schemas', () => {
  describe('AvailableHoursSchema', () => {
    it('should accept valid available hours', () => {
      const data = {
        Pazartesi: ['09:00-10:00'],
        Salı: ['14:00-15:00'],
        Çarşamba: [],
        Perşembe: ['10:00-12:00'],
        Cuma: [],
      };
      expect(AvailableHoursSchema.parse(data)).toEqual(data);
    });

    it('should reject invalid time format', () => {
      const data = {
        Pazartesi: ['09:00'], // missing end time
        Salı: [],
        Çarşamba: [],
        Perşembe: [],
        Cuma: [],
      };
      expect(() => AvailableHoursSchema.parse(data)).toThrow();
    });

    it('should reject invalid day names', () => {
      const data = { Monday: ['09:00-10:00'] };
      expect(() => AvailableHoursSchema.parse(data)).toThrow();
    });
  });

  describe('CourseSessionSchema', () => {
    it('should accept valid session', () => {
      const data = { type: 'teorik', hours: 3 };
      expect(CourseSessionSchema.parse(data)).toEqual(data);
    });

    it('should accept lab type', () => {
      expect(CourseSessionSchema.parse({ type: 'lab', hours: 2 })).toBeTruthy();
    });

    it('should accept tümü type', () => {
      expect(CourseSessionSchema.parse({ type: 'tümü', hours: 4 })).toBeTruthy();
    });

    it('should reject invalid type', () => {
      expect(() => CourseSessionSchema.parse({ type: 'invalid', hours: 2 })).toThrow();
    });

    it('should reject hours less than 1', () => {
      expect(() => CourseSessionSchema.parse({ type: 'teorik', hours: 0 })).toThrow();
    });

    it('should reject hours more than 10', () => {
      expect(() => CourseSessionSchema.parse({ type: 'teorik', hours: 11 })).toThrow();
    });
  });

  describe('CourseDepartmentSchema', () => {
    it('should accept valid department', () => {
      const data = { department: 'bilgisayar', student_count: 50 };
      expect(CourseDepartmentSchema.parse(data)).toEqual(data);
    });

    it('should reject negative student count', () => {
      expect(() =>
        CourseDepartmentSchema.parse({ department: 'bilgisayar', student_count: -1 })
      ).toThrow();
    });

    it('should reject student count over 1000', () => {
      expect(() =>
        CourseDepartmentSchema.parse({ department: 'bilgisayar', student_count: 1001 })
      ).toThrow();
    });
  });

  describe('CreateCourseSchema', () => {
    const validCourse = {
      name: 'Veri Yapıları',
      code: 'BIL201',
      teacher_id: 1,
      faculty: 'muhendislik',
      level: '2' as const,
      category: 'zorunlu' as const,
      semester: 'Güz',
      ects: 6,
      is_active: true,
      sessions: [{ type: 'teorik' as const, hours: 3 }],
      departments: [{ department: 'bilgisayar', student_count: 60 }],
    };

    it('should accept valid course', () => {
      expect(CreateCourseSchema.parse(validCourse)).toBeTruthy();
    });

    it('should reject empty name', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, name: '' })).toThrow();
    });

    it('should reject invalid code format', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, code: 'invalid' })).toThrow();
    });

    it('should accept valid code formats', () => {
      expect(CreateCourseSchema.parse({ ...validCourse, code: 'BIL101' })).toBeTruthy();
      expect(CreateCourseSchema.parse({ ...validCourse, code: 'CENG1001' })).toBeTruthy();
    });

    it('should reject empty sessions array', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, sessions: [] })).toThrow();
    });

    it('should reject empty departments array', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, departments: [] })).toThrow();
    });

    it('should reject invalid level', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, level: '5' })).toThrow();
    });

    it('should reject ECTS over 30', () => {
      expect(() => CreateCourseSchema.parse({ ...validCourse, ects: 31 })).toThrow();
    });

    it('should default capacity_margin to 0', () => {
      const result = CreateCourseSchema.parse(validCourse);
      expect(result.capacity_margin).toBe(0);
    });
  });

  describe('UpdateCourseSchema', () => {
    it('should allow partial updates', () => {
      expect(UpdateCourseSchema.parse({ name: 'New Name' })).toBeTruthy();
      expect(UpdateCourseSchema.parse({ ects: 5 })).toBeTruthy();
    });

    it('should allow empty object', () => {
      expect(UpdateCourseSchema.parse({})).toBeTruthy();
    });
  });

  describe('CreateTeacherSchema', () => {
    const validTeacher = {
      name: 'Dr. Ahmet Yılmaz',
      email: 'ahmet@university.edu.tr',
      title: 'Doç. Dr.' as const,
      faculty: 'muhendislik',
      department: 'bilgisayar',
      is_active: true,
    };

    it('should accept valid teacher', () => {
      expect(CreateTeacherSchema.parse(validTeacher)).toBeTruthy();
    });

    it('should reject short name', () => {
      expect(() => CreateTeacherSchema.parse({ ...validTeacher, name: 'A' })).toThrow();
    });

    it('should reject invalid email', () => {
      expect(() => CreateTeacherSchema.parse({ ...validTeacher, email: 'not-an-email' })).toThrow();
    });

    it('should lowercase email', () => {
      const result = CreateTeacherSchema.parse({ ...validTeacher, email: 'AHMET@UNI.EDU.TR' });
      expect(result.email).toBe('ahmet@uni.edu.tr');
    });

    it('should accept valid working_hours JSON', () => {
      const result = CreateTeacherSchema.parse({
        ...validTeacher,
        working_hours: '{"Pazartesi": ["09:00-10:00"]}',
      });
      expect(result).toBeTruthy();
    });

    it('should reject invalid working_hours JSON', () => {
      expect(() =>
        CreateTeacherSchema.parse({ ...validTeacher, working_hours: 'not-json' })
      ).toThrow();
    });
  });

  describe('UpdateTeacherSchema', () => {
    it('should allow partial updates', () => {
      expect(UpdateTeacherSchema.parse({ name: 'New Name' })).toBeTruthy();
    });
  });

  describe('CreateClassroomSchema', () => {
    const validClassroom = {
      name: 'B101',
      capacity: 50,
      type: 'teorik' as const,
      faculty: 'muhendislik',
      department: 'bilgisayar',
    };

    it('should accept valid classroom', () => {
      expect(CreateClassroomSchema.parse(validClassroom)).toBeTruthy();
    });

    it('should reject empty name', () => {
      expect(() => CreateClassroomSchema.parse({ ...validClassroom, name: '' })).toThrow();
    });

    it('should reject capacity less than 1', () => {
      expect(() => CreateClassroomSchema.parse({ ...validClassroom, capacity: 0 })).toThrow();
    });

    it('should reject capacity over 1000', () => {
      expect(() => CreateClassroomSchema.parse({ ...validClassroom, capacity: 1001 })).toThrow();
    });

    it('should accept lab type', () => {
      expect(CreateClassroomSchema.parse({ ...validClassroom, type: 'lab' })).toBeTruthy();
    });

    it('should accept hibrit type', () => {
      expect(CreateClassroomSchema.parse({ ...validClassroom, type: 'hibrit' })).toBeTruthy();
    });

    it('should reject invalid type', () => {
      expect(() => CreateClassroomSchema.parse({ ...validClassroom, type: 'invalid' })).toThrow();
    });
  });
});
