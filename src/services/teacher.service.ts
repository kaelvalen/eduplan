/**
 * Teacher Service - Business logic for teacher operations
 */

import prisma from '@/lib/prisma';
import { BaseService } from './base.service';
import type { Teacher, TeacherCreate, TeacherWithSchedule } from '@/types';
import type { CreateTeacherInput, UpdateTeacherInput } from '@/lib/schemas';

export interface TeacherFilters {
  isActive?: boolean;
  faculty?: string;
  department?: string;
  searchTerm?: string;
}

export class TeacherService extends BaseService<Teacher, CreateTeacherInput, UpdateTeacherInput> {
  protected modelName = 'teacher';
  protected cacheKeyPrefix = 'teachers';
  protected cacheTTL = 600; // 10 minutes for teachers

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters?: TeacherFilters) {
    const where: any = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.faculty) {
      where.faculty = filters.faculty;
    }

    if (filters?.department) {
      where.department = filters.department;
    }

    if (filters?.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: 'insensitive' } },
        { email: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Get all teachers with optional filters
   */
  async getTeachers(filters?: TeacherFilters): Promise<Teacher[]> {
    const cacheKey = this.getListCacheKey(filters);

    return this.getCached(cacheKey, async () => {
      const teachers = await prisma.teacher.findMany({
        where: this.buildWhereClause(filters),
        orderBy: [
          { name: 'asc' },
        ],
      });

      return teachers.map(this.transformTeacher);
    });
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(id: number): Promise<Teacher | null> {
    const cacheKey = this.getCacheKey(id);

    return this.getCached(cacheKey, async () => {
      const teacher = await prisma.teacher.findUnique({
        where: { id },
      });

      return teacher ? this.transformTeacher(teacher) : null;
    });
  }

  /**
   * Get teacher by email
   */
  async getTeacherByEmail(email: string): Promise<Teacher | null> {
    const teacher = await prisma.teacher.findUnique({
      where: { email },
    });

    return teacher ? this.transformTeacher(teacher) : null;
  }

  /**
   * Get teacher with schedule
   */
  async getTeacherWithSchedule(id: number): Promise<TeacherWithSchedule | null> {
    const teacher = await prisma.teacher.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            schedules: {
              include: {
                classroom: true,
              },
            },
          },
        },
      },
    });

    if (!teacher) return null;

    const schedules = teacher.courses.flatMap(course =>
      course.schedules.map((s: any) => ({
        id: s.id,
        day: s.day,
        time_range: s.timeRange,
        course_id: s.courseId,
        classroom_id: s.classroomId,
        is_hardcoded: s.isHardcoded,
        session_type: s.sessionType,
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
          teacher_id: course.teacherId,
        },
        classroom: s.classroom ? {
          id: s.classroom.id,
          name: s.classroom.name,
          type: s.classroom.type,
          capacity: s.classroom.capacity,
        } : null,
      }))
    );

    return {
      ...this.transformTeacher(teacher),
      schedule: schedules,
    };
  }

  /**
   * Create new teacher
   */
  async createTeacher(data: CreateTeacherInput): Promise<Teacher> {
    // Check if email already exists
    const existing = await this.getTeacherByEmail(data.email);
    if (existing) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor');
    }

    const teacher = await prisma.teacher.create({
      data: {
        name: data.name,
        email: data.email,
        title: data.title || 'Öğr. Gör.',
        faculty: data.faculty,
        department: data.department,
        workingHours: data.working_hours || '{}',
        isActive: data.is_active ?? true,
      },
    });

    this.invalidateCache();
    return this.transformTeacher(teacher);
  }

  /**
   * Update teacher
   */
  async updateTeacher(id: number, data: UpdateTeacherInput): Promise<Teacher> {
    // If email is being updated, check for conflicts
    if (data.email) {
      const existing = await this.getTeacherByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor');
      }
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.title && { title: data.title }),
        ...(data.faculty && { faculty: data.faculty }),
        ...(data.department && { department: data.department }),
        ...(data.working_hours !== undefined && { workingHours: data.working_hours }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      },
    });

    this.invalidateCache(id);
    return this.transformTeacher(teacher);
  }

  /**
   * Delete teacher
   */
  async deleteTeacher(id: number): Promise<void> {
    // Check if teacher has courses
    const courses = await prisma.course.findMany({
      where: { teacherId: id },
    });

    if (courses.length > 0) {
      throw new Error('Bu öğretmenin dersleri var. Önce dersleri silin veya başka öğretmene atayın.');
    }

    await prisma.teacher.delete({
      where: { id },
    });

    this.invalidateCache(id);
  }

  /**
   * Get teachers by faculty
   */
  async getTeachersByFaculty(faculty: string): Promise<Teacher[]> {
    return this.getTeachers({ faculty });
  }

  /**
   * Get teachers by department
   */
  async getTeachersByDepartment(department: string): Promise<Teacher[]> {
    return this.getTeachers({ department });
  }

  /**
   * Transform Prisma teacher to API format
   */
  private transformTeacher(teacher: any): Teacher {
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      title: teacher.title,
      faculty: teacher.faculty,
      department: teacher.department,
      working_hours: teacher.workingHours,
      is_active: teacher.isActive,
    };
  }
}

// Export singleton instance
export const teacherService = new TeacherService();
