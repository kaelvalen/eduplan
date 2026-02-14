import { describe, it, expect } from 'vitest';
import { validateTeacherAvailability, validateClassroomAvailability } from '@/lib/schedule-validation';
import type { Teacher, Classroom, Schedule } from '@/types';

describe('Schedule Validation', () => {
  describe('validateTeacherAvailability', () => {
    const baseTeacher: Teacher = {
      id: 1,
      name: 'Dr. Ahmet Yılmaz',
      email: 'ahmet@uni.edu.tr',
      faculty: 'muhendislik',
      department: 'bilgisayar',
      working_hours: JSON.stringify({
        Pazartesi: ['09:00-10:00', '10:00-11:00', '14:00-15:00'],
        Salı: ['09:00-10:00'],
      }),
    };

    const emptySchedules: Schedule[] = [];

    it('should return valid when teacher is null', () => {
      const result = validateTeacherAvailability(null, 'Pazartesi', '09:00', '10:00', emptySchedules);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid when teacher is available', () => {
      const result = validateTeacherAvailability(baseTeacher, 'Pazartesi', '09:00', '10:00', emptySchedules);
      expect(result.valid).toBe(true);
    });

    it('should return invalid when teacher is not available on that day', () => {
      const result = validateTeacherAvailability(baseTeacher, 'Çarşamba', '09:00', '10:00', emptySchedules);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return invalid when teacher is not available at that time', () => {
      const result = validateTeacherAvailability(baseTeacher, 'Pazartesi', '16:00', '17:00', emptySchedules);
      expect(result.valid).toBe(false);
    });

    it('should warn when teacher has no working hours defined', () => {
      const teacherNoHours: Teacher = { ...baseTeacher, working_hours: null };
      const result = validateTeacherAvailability(teacherNoHours, 'Pazartesi', '09:00', '10:00', emptySchedules);
      expect(result.errors.some(e => e.includes('tanımlanmamış'))).toBe(true);
    });

    it('should detect schedule conflicts', () => {
      const schedules: Schedule[] = [
        {
          id: 1,
          day: 'Pazartesi',
          time_range: '09:00-10:00',
          course: {
            id: 1,
            name: 'Test',
            code: 'TST101',
            teacher_id: 1,
            faculty: 'muhendislik',
            level: '1',
            category: 'zorunlu',
            semester: 'Güz',
            ects: 4,
            is_active: true,
            departments: [],
            sessions: [],
          },
        },
      ];

      const result = validateTeacherAvailability(baseTeacher, 'Pazartesi', '09:00', '10:00', schedules);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('başka bir dersi var'))).toBe(true);
    });

    it('should exclude current schedule from conflict check', () => {
      const schedules: Schedule[] = [
        {
          id: 5,
          day: 'Pazartesi',
          time_range: '09:00-10:00',
          course: {
            id: 1,
            name: 'Test',
            code: 'TST101',
            teacher_id: 1,
            faculty: 'muhendislik',
            level: '1',
            category: 'zorunlu',
            semester: 'Güz',
            ects: 4,
            is_active: true,
            departments: [],
            sessions: [],
          },
        },
      ];

      const result = validateTeacherAvailability(baseTeacher, 'Pazartesi', '09:00', '10:00', schedules, 5);
      expect(result.valid).toBe(true);
    });

    it('should handle invalid JSON working_hours gracefully', () => {
      const teacherBadJson: Teacher = { ...baseTeacher, working_hours: 'invalid' };
      const result = validateTeacherAvailability(teacherBadJson, 'Pazartesi', '09:00', '10:00', emptySchedules);
      // Should not throw, may have warning
      expect(result).toBeDefined();
    });
  });

  describe('validateClassroomAvailability', () => {
    const baseClassroom: Classroom = {
      id: 1,
      name: 'B101',
      capacity: 50,
      type: 'teorik',
      faculty: 'muhendislik',
      department: 'bilgisayar',
      available_hours: JSON.stringify({
        Pazartesi: ['08:00-09:00', '09:00-10:00', '10:00-11:00'],
        Salı: ['09:00-10:00'],
      }),
    };

    const emptySchedules: Schedule[] = [];

    it('should return invalid when classroom is null', () => {
      const result = validateClassroomAvailability(null, 'Pazartesi', '09:00', '10:00', emptySchedules);
      expect(result.valid).toBe(false);
    });

    it('should return valid when classroom has no availability restrictions', () => {
      const noRestrictions: Classroom = { ...baseClassroom, available_hours: null };
      const result = validateClassroomAvailability(noRestrictions, 'Pazartesi', '09:00', '10:00', emptySchedules);
      expect(result.valid).toBe(true);
    });

    it('should detect classroom schedule conflicts', () => {
      const schedules: Schedule[] = [
        {
          id: 1,
          day: 'Pazartesi',
          time_range: '09:00-10:00',
          classroom_id: 1,
        },
      ];

      const result = validateClassroomAvailability(baseClassroom, 'Pazartesi', '09:00', '10:00', schedules);
      expect(result.valid).toBe(false);
    });

    it('should exclude current schedule from conflict check', () => {
      const schedules: Schedule[] = [
        {
          id: 5,
          day: 'Pazartesi',
          time_range: '09:00-10:00',
          classroom_id: 1,
        },
      ];

      const result = validateClassroomAvailability(baseClassroom, 'Pazartesi', '09:00', '10:00', schedules, 5);
      expect(result.valid).toBe(true);
    });
  });
});
