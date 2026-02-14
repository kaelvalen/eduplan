/**
 * Course Service - Business logic for course operations
 */

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { BaseService } from './base.service';
import type { Course } from '@/types';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/schemas';
import { parseTeacherWorkingHoursSafe } from '@/lib/time-utils';

export interface CourseFilters {
  isActive?: boolean;
  faculty?: string;
  department?: string;
  teacherId?: number;
  searchTerm?: string;
  level?: string;
  category?: 'zorunlu' | 'secmeli';
}

export class CourseService extends BaseService<Course, CreateCourseInput, UpdateCourseInput> {
  protected modelName = 'course';
  protected cacheKeyPrefix = 'courses';

  /**
   * Build where clause for filtering
   */
  private buildWhereClause(filters?: CourseFilters): Prisma.CourseWhereInput {
    const where: Prisma.CourseWhereInput = {};

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.faculty) {
      where.faculty = filters.faculty;
    }

    if (filters?.teacherId) {
      where.teacherId = filters.teacherId;
    }

    if (filters?.level) {
      where.level = filters.level;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm } },
        { code: { contains: filters.searchTerm } },
      ];
    }

    return where;
  }

  /**
   * Get all courses with optional filters
   */
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    const cacheKey = this.getListCacheKey(filters);

    return this.getCached(cacheKey, async () => {
      const courses = await prisma.course.findMany({
        where: this.buildWhereClause(filters),
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          sessions: {
            select: {
              id: true,
              type: true,
              hours: true,
            },
          },
          departments: {
            select: {
              id: true,
              department: true,
              studentCount: true,
            },
          },
          hardcodedSchedules: {
            include: {
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { code: 'asc' },
        ],
      });

      return courses.map(this.transformCourse);
    });
  }

  /**
   * Get course by ID
   */
  async getCourseById(id: number): Promise<Course | null> {
    const cacheKey = this.getCacheKey(id);

    return this.getCached(cacheKey, async () => {
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          sessions: {
            select: {
              id: true,
              type: true,
              hours: true,
            },
          },
          departments: {
            select: {
              id: true,
              department: true,
              studentCount: true,
            },
          },
          hardcodedSchedules: {
            include: {
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return course ? this.transformCourse(course) : null;
    });
  }

  /**
   * Get course by code
   */
  async getCourseByCode(code: string): Promise<Course | null> {
    const course = await prisma.course.findUnique({
      where: { code },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            title: true,
          },
        },
        sessions: {
          select: {
            id: true,
            type: true,
            hours: true,
          },
        },
        departments: {
          select: {
            id: true,
            department: true,
            studentCount: true,
          },
        },
        hardcodedSchedules: {
          include: {
            classroom: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return course ? this.transformCourse(course) : null;
  }

  /**
   * Create new course
   * Uses transaction to prevent race conditions
   */
  async createCourse(data: CreateCourseInput): Promise<Course> {
    const course = await prisma.$transaction(async (tx) => {
      // Check if code already exists (inside transaction for atomicity)
      const existing = await tx.course.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new Error('Bu ders kodu zaten kullanılıyor');
      }

      // Calculate total_hours from sessions if not provided
      const totalHours = data.total_hours ?? data.sessions.reduce((sum, s) => sum + s.hours, 0);

      // Create course with nested relations
      return await tx.course.create({
        data: {
          name: data.name,
          code: data.code,
          teacherId: data.teacher_id || null,
          faculty: data.faculty,
          level: data.level,
          category: data.category,
          semester: data.semester,
          ects: data.ects,
          totalHours: totalHours,
          capacityMargin: data.capacity_margin || 0,
          isActive: data.is_active,
          sessions: {
            create: data.sessions.map(s => ({
              type: s.type,
              hours: s.hours,
            })),
          },
          departments: {
            create: data.departments.map(d => ({
              department: d.department,
              studentCount: d.student_count,
            })),
          },
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          sessions: {
            select: {
              id: true,
              type: true,
              hours: true,
            },
          },
          departments: {
            select: {
              id: true,
              department: true,
              studentCount: true,
            },
          },
          hardcodedSchedules: {
            include: {
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }, {
      maxWait: 5000, // 5 seconds max wait to acquire transaction
      timeout: 10000, // 10 seconds max transaction time
    });

    this.invalidateCache();
    return this.transformCourse(course);
  }

  /**
   * Update course
   * Uses transaction to prevent data loss if update fails after deletes
   */
  async updateCourse(id: number, data: UpdateCourseInput): Promise<Course> {
    const course = await prisma.$transaction(async (tx) => {
      // If code is being updated, check for conflicts (inside transaction)
      if (data.code) {
        const existing = await tx.course.findUnique({
          where: { code: data.code },
        });

        if (existing && existing.id !== id) {
          throw new Error('Bu ders kodu zaten kullanılıyor');
        }
      }

      // Delete existing sessions and departments if provided
      if (data.sessions) {
        await tx.courseSession.deleteMany({
          where: { courseId: id },
        });
      }

      if (data.departments) {
        await tx.courseDepartment.deleteMany({
          where: { courseId: id },
        });
      }

      // Calculate total_hours from sessions if sessions are provided but total_hours is not
      const totalHours = data.sessions && !data.total_hours
        ? data.sessions.reduce((sum, s) => sum + s.hours, 0)
        : data.total_hours;

      // Update course with new data
      return await tx.course.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.code && { code: data.code }),
          ...(data.teacher_id !== undefined && { teacherId: data.teacher_id }),
          ...(data.faculty && { faculty: data.faculty }),
          ...(data.level && { level: data.level }),
          ...(data.category && { category: data.category }),
          ...(data.semester && { semester: data.semester }),
          ...(data.ects && { ects: data.ects }),
          ...(totalHours && { totalHours: totalHours }),
          ...(data.capacity_margin !== undefined && { capacityMargin: data.capacity_margin }),
          ...(data.is_active !== undefined && { isActive: data.is_active }),
          ...(data.sessions && {
            sessions: {
              create: data.sessions.map(s => ({
                type: s.type,
                hours: s.hours,
              })),
            },
          }),
          ...(data.departments && {
            departments: {
              create: data.departments.map(d => ({
                department: d.department,
                studentCount: d.student_count,
              })),
            },
          }),
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              title: true,
            },
          },
          sessions: {
            select: {
              id: true,
              type: true,
              hours: true,
            },
          },
          departments: {
            select: {
              id: true,
              department: true,
              studentCount: true,
            },
          },
          hardcodedSchedules: {
            include: {
              classroom: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    }, {
      maxWait: 5000,
      timeout: 10000,
    });

    this.invalidateCache(id);
    return this.transformCourse(course);
  }

  /**
   * Delete course
   */
  async deleteCourse(id: number): Promise<void> {
    await prisma.course.delete({
      where: { id },
    });

    this.invalidateCache(id);
  }

  /**
   * Get courses by teacher ID
   */
  async getCoursesByTeacher(teacherId: number): Promise<Course[]> {
    return this.getCourses({ teacherId });
  }

  /**
   * Get active courses for scheduler
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getActiveCoursesForScheduler(): Promise<any[]> {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        teacher: true,
        sessions: true,
        departments: true,
        hardcodedSchedules: {
          include: {
            classroom: true,
          },
        },
      },
    });

    return courses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.code,
      teacherId: course.teacherId,
      faculty: course.faculty,
      level: course.level,
      category: course.category,
      semester: course.semester,
      totalHours: course.totalHours,
      capacityMargin: course.capacityMargin,
      sessions: course.sessions.map(s => ({
        type: s.type,
        hours: s.hours,
      })),
      departments: course.departments.map(d => ({
        department: d.department,
        studentCount: d.studentCount,
      })),
      teacherWorkingHours: parseTeacherWorkingHoursSafe(course.teacher?.workingHours),
      hardcodedSchedules: course.hardcodedSchedules.map(h => ({
        day: h.day,
        startTime: h.startTime,
        endTime: h.endTime,
        sessionType: h.sessionType,
        classroomId: h.classroomId,
      })),
    }));
  }

  /**
   * Transform Prisma course to API format
   */
  private transformCourse(
    course: Prisma.CourseGetPayload<{
      include: {
        teacher: { select: { id: true; name: true; title: true } };
        sessions: { select: { id: true; type: true; hours: true } };
        departments: { select: { id: true; department: true; studentCount: true } };
        hardcodedSchedules: { include: { classroom: { select: { id: true; name: true } } } };
      };
    }>
  ): Course {
    return {
      id: course.id,
      name: course.name,
      code: course.code,
      teacher_id: course.teacherId,
      faculty: course.faculty,
      level: course.level,
      category: course.category as 'zorunlu' | 'secmeli',
      semester: course.semester,
      ects: course.ects,
      total_hours: course.totalHours,
      capacity_margin: course.capacityMargin,
      is_active: course.isActive,
      sessions: course.sessions?.map((s) => ({
        id: s.id,
        type: s.type as 'teorik' | 'lab' | 'tümü',
        hours: s.hours,
      })) || [],
      departments: course.departments?.map((d) => ({
        id: d.id,
        department: d.department,
        student_count: d.studentCount,
      })) || [],
      hardcoded_schedules: course.hardcodedSchedules?.map((h) => ({
        id: h.id,
        course_id: h.courseId,
        session_type: h.sessionType as 'teorik' | 'lab',
        day: h.day,
        start_time: h.startTime,
        end_time: h.endTime,
        classroom_id: h.classroomId ?? undefined,
        classroom: h.classroom,
      })) || [],
      teacher: course.teacher ? {
        id: course.teacher.id,
        name: course.teacher.name,
        title: course.teacher.title,
      } : null,
    };
  }
}

// Export singleton instance
export const courseService = new CourseService();
