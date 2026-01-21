/**
 * Classroom Service - Business logic for classroom operations
 */

import prisma from '@/lib/prisma';
import { BaseService } from './base.service';
import type { Classroom, ClassroomCreate, ClassroomWithSchedule } from '@/types';
import type { CreateClassroomInput, UpdateClassroomInput } from '@/lib/schemas';

export interface ClassroomFilters {
  isActive?: boolean;
  faculty?: string;
  department?: string;
  type?: 'teorik' | 'lab';
  searchTerm?: string;
}

export class ClassroomService extends BaseService<Classroom, CreateClassroomInput, UpdateClassroomInput> {
  protected modelName = 'classroom';
  protected cacheKeyPrefix = 'classrooms';

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters?: ClassroomFilters) {
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

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.searchTerm) {
      where.name = {
        contains: filters.searchTerm,
        mode: 'insensitive',
      };
    }

    return where;
  }

  /**
   * Get all classrooms with optional filters
   */
  async getClassrooms(filters?: ClassroomFilters): Promise<Classroom[]> {
    const cacheKey = this.getListCacheKey(filters);

    return this.getCached(cacheKey, async () => {
      const classrooms = await prisma.classroom.findMany({
        where: this.buildWhereClause(filters),
        orderBy: [
          { name: 'asc' },
        ],
      });

      return classrooms.map(this.transformClassroom);
    });
  }

  /**
   * Get classroom by ID
   */
  async getClassroomById(id: number): Promise<Classroom | null> {
    const cacheKey = this.getCacheKey(id);

    return this.getCached(cacheKey, async () => {
      const classroom = await prisma.classroom.findUnique({
        where: { id },
      });

      return classroom ? this.transformClassroom(classroom) : null;
    });
  }

  /**
   * Get classroom by name and department
   */
  async getClassroomByNameAndDept(name: string, department: string): Promise<Classroom | null> {
    const classroom = await prisma.classroom.findUnique({
      where: {
        name_department: {
          name,
          department,
        },
      },
    });

    return classroom ? this.transformClassroom(classroom) : null;
  }

  /**
   * Get classroom with schedule
   */
  async getClassroomWithSchedule(id: number): Promise<ClassroomWithSchedule | null> {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        schedules: {
          include: {
            course: {
              include: {
                teacher: true,
                sessions: true,
                departments: true,
              },
            },
          },
          orderBy: [
            { day: 'asc' },
            { timeRange: 'asc' },
          ],
        },
      },
    });

    if (!classroom) return null;

    const schedules = classroom.schedules.map((s: any) => ({
      id: s.id,
      day: s.day,
      time_range: s.timeRange,
      course_id: s.courseId,
      classroom_id: s.classroomId,
      is_hardcoded: s.isHardcoded,
      session_type: s.sessionType,
      course: s.course ? {
        id: s.course.id,
        name: s.course.name,
        code: s.course.code,
        teacher_id: s.course.teacherId || 0,
        faculty: s.course.faculty,
        level: s.course.level,
        category: (s.course.category as 'zorunlu' | 'secmeli') || 'zorunlu',
        semester: s.course.semester,
        ects: s.course.ects,
        is_active: s.course.isActive,
        teacher: s.course.teacher ? {
          id: s.course.teacher.id,
          name: s.course.teacher.name,
          title: s.course.teacher.title || undefined,
          email: s.course.teacher.email,
          faculty: s.course.teacher.faculty,
          department: s.course.teacher.department,
          working_hours: (s.course.teacher as any).workingHours || null,
        } : null,
        total_hours: s.course.totalHours,
        departments: s.course.departments?.map((d: any) => ({
          id: d.id,
          department: d.department,
          student_count: d.studentCount,
        })) || [],
        sessions: s.course.sessions?.map((sess: any) => ({
          id: sess.id,
          type: (sess.type as 'teorik' | 'lab' | 'tümü') || 'teorik',
          hours: sess.hours,
        })) || [],
      } : null,
      classroom: {
        id: classroom.id,
        name: classroom.name,
        type: (classroom.type as 'teorik' | 'lab' | 'hibrit') || 'teorik',
        capacity: classroom.capacity,
        faculty: classroom.faculty,
        department: classroom.department,
        available_hours: (classroom as any).availableHours || null,
      },
    }));

    return {
      ...this.transformClassroom(classroom),
      schedule: schedules,
    };
  }

  /**
   * Create new classroom
   */
  async createClassroom(data: CreateClassroomInput): Promise<Classroom> {
    // Check if classroom already exists in this department
    const existing = await this.getClassroomByNameAndDept(data.name, data.department);
    if (existing) {
      throw new Error('Bu derslik zaten bu bölümde mevcut');
    }

    const classroom = await prisma.classroom.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        type: data.type,
        faculty: data.faculty,
        department: data.department,
        priorityDept: data.priority_dept || null,
        availableHours: data.available_hours ? JSON.stringify(data.available_hours) : '{}',
        isActive: data.is_active ?? true,
      },
    });

    this.invalidateCache();
    return this.transformClassroom(classroom);
  }

  /**
   * Update classroom
   */
  async updateClassroom(id: number, data: UpdateClassroomInput): Promise<Classroom> {
    // If name or department is being updated, check for conflicts
    if (data.name || data.department) {
      const current = await this.getClassroomById(id);
      if (!current) {
        throw new Error('Derslik bulunamadı');
      }

      const newName = data.name || current.name;
      const newDept = data.department || current.department;

      const existing = await this.getClassroomByNameAndDept(newName, newDept);
      if (existing && existing.id !== id) {
        throw new Error('Bu derslik zaten bu bölümde mevcut');
      }
    }

    const classroom = await prisma.classroom.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.type && { type: data.type }),
        ...(data.faculty && { faculty: data.faculty }),
        ...(data.department && { department: data.department }),
        ...(data.priority_dept !== undefined && { priorityDept: data.priority_dept }),
        ...(data.available_hours && { availableHours: JSON.stringify(data.available_hours) }),
        ...(data.is_active !== undefined && { isActive: data.is_active }),
      },
    });

    this.invalidateCache(id);
    return this.transformClassroom(classroom);
  }

  /**
   * Delete classroom
   */
  async deleteClassroom(id: number): Promise<void> {
    // Check if classroom has schedules
    const schedules = await prisma.schedule.findMany({
      where: { classroomId: id },
    });

    if (schedules.length > 0) {
      throw new Error('Bu dersliğin programları var. Önce programları silin.');
    }

    await prisma.classroom.delete({
      where: { id },
    });

    this.invalidateCache(id);
  }

  /**
   * Get classrooms by faculty
   */
  async getClassroomsByFaculty(faculty: string): Promise<Classroom[]> {
    return this.getClassrooms({ faculty });
  }

  /**
   * Get classrooms by department
   */
  async getClassroomsByDepartment(department: string): Promise<Classroom[]> {
    return this.getClassrooms({ department });
  }

  /**
   * Get classrooms by type
   */
  async getClassroomsByType(type: 'teorik' | 'lab'): Promise<Classroom[]> {
    return this.getClassrooms({ type });
  }

  /**
   * Get active classrooms for scheduler
   */
  async getActiveClassroomsForScheduler(): Promise<any[]> {
    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
    });

    return classrooms.map(classroom => ({
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      type: classroom.type,
      priorityDept: classroom.priorityDept,
      availableHours: classroom.availableHours 
        ? JSON.parse(classroom.availableHours) 
        : {},
      isActive: classroom.isActive,
    }));
  }

  /**
   * Transform Prisma classroom to API format
   */
  private transformClassroom(classroom: any): Classroom {
    return {
      id: classroom.id,
      name: classroom.name,
      capacity: classroom.capacity,
      type: classroom.type,
      faculty: classroom.faculty,
      department: classroom.department,
      priority_dept: classroom.priorityDept,
      available_hours: classroom.availableHours,
      is_active: classroom.isActive,
    };
  }
}

// Export singleton instance
export const classroomService = new ClassroomService();
