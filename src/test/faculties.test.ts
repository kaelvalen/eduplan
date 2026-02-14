import { describe, it, expect } from 'vitest';
import {
  FACULTIES,
  DEPARTMENTS,
  getFacultyName,
  getDepartmentName,
  getDepartmentsByFaculty,
} from '@/constants/faculties';

describe('Faculty Constants', () => {
  describe('FACULTIES', () => {
    it('should have at least 10 faculties', () => {
      expect(FACULTIES.length).toBeGreaterThanOrEqual(10);
    });

    it('each faculty should have id and name', () => {
      for (const faculty of FACULTIES) {
        expect(faculty.id).toBeTruthy();
        expect(faculty.name).toBeTruthy();
      }
    });

    it('should contain Mühendislik Fakültesi', () => {
      const eng = FACULTIES.find(f => f.id === 'muhendislik');
      expect(eng).toBeDefined();
      expect(eng?.name).toBe('Mühendislik Fakültesi');
    });

    it('should have unique ids', () => {
      const ids = FACULTIES.map(f => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('DEPARTMENTS', () => {
    it('should have departments for muhendislik', () => {
      const depts = DEPARTMENTS['muhendislik'];
      expect(depts).toBeDefined();
      expect(depts.length).toBeGreaterThan(0);
    });

    it('should include Bilgisayar Mühendisliği', () => {
      const depts = DEPARTMENTS['muhendislik'];
      const cse = depts.find(d => d.id === 'bilgisayar');
      expect(cse).toBeDefined();
      expect(cse?.name).toBe('Bilgisayar Mühendisliği');
    });

    it('should have departments for every faculty', () => {
      for (const faculty of FACULTIES) {
        expect(DEPARTMENTS[faculty.id]).toBeDefined();
        expect(DEPARTMENTS[faculty.id].length).toBeGreaterThan(0);
      }
    });

    it('each department should have id and name', () => {
      for (const [, depts] of Object.entries(DEPARTMENTS)) {
        for (const dept of depts) {
          expect(dept.id).toBeTruthy();
          expect(dept.name).toBeTruthy();
        }
      }
    });
  });

  describe('getFacultyName', () => {
    it('should return faculty name by id', () => {
      expect(getFacultyName('muhendislik')).toBe('Mühendislik Fakültesi');
      expect(getFacultyName('fen')).toBe('Fen Fakültesi');
    });

    it('should return id for unknown faculty', () => {
      expect(getFacultyName('unknown-faculty')).toBe('unknown-faculty');
    });
  });

  describe('getDepartmentName', () => {
    it('should return department name by faculty and dept id', () => {
      expect(getDepartmentName('muhendislik', 'bilgisayar')).toBe('Bilgisayar Mühendisliği');
    });

    it('should return id for unknown department', () => {
      expect(getDepartmentName('muhendislik', 'unknown')).toBe('unknown');
    });

    it('should return id for unknown faculty', () => {
      expect(getDepartmentName('unknown', 'bilgisayar')).toBe('bilgisayar');
    });
  });

  describe('getDepartmentsByFaculty', () => {
    it('should return departments for valid faculty', () => {
      const depts = getDepartmentsByFaculty('muhendislik');
      expect(depts.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown faculty', () => {
      expect(getDepartmentsByFaculty('nonexistent')).toEqual([]);
    });
  });
});
