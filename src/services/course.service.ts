/**
 * Course Service - Business logic for course operations
 */

import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { BaseService } from './base.service';
import type { Course } from '@/types';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/schemas';

// Define the Prisma type for Course with includes
type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    teacher: {
      select: {
        id: true;
        name: true;
        title: true;
      };
    };
    sessions: true;
    departments: true;
    hardcodedSchedules: {
      include: {
        classroom: {
          select: {
            id: true;
            name: true;
          };
        };
      };
    };
  };
}>;

// Minimal relation type for internal usage where hardcoded schedules might not be loaded deeply
type MinimalCourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    teacher: {
      select: {
        id: true;
        name: true;
        title: true;
      };
    };
    sessions: true;
    departments: true;
  };
}>;

export interface CourseFilters {
  isActive?: boolean;
  faculty?: string;
  department?: string;
  teacherId?: number;
  searchTerm?: string;
  level?: string;
  category?: 'zorunlu' | 'secmeli';
}

export class CourseService extends BaseService {
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
          sessions: true,
          departments: true,
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

      return courses.map(c => this.transformCourse(c as unknown as CourseWithRelations));
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
          sessions: true,
          departments: true,
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

      return course ? this.transformCourse(course as unknown as CourseWithRelations) : null;
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
        sessions: true,
        departments: true,
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

    return course ? this.transformCourse(course as unknown as CourseWithRelations) : null;
  }

  /**
   * Create new course
   */
  async createCourse(data: CreateCourseInput): Promise<Course> {
    // Check if code already exists
    const existing = await this.getCourseByCode(data.code);
    if (existing) {
      throw new Error('Bu ders kodu zaten kullanılıyor');
    }

    const course = await prisma.course.create({
      data: {
        name: data.name,
        code: data.code,
        teacherId: data.teacher_id || null,
        faculty: data.faculty,
        level: data.level,
        category: data.category,
        semester: data.semester,
        ects: data.ects,
        totalHours: data.total_hours,
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
        sessions: true,
        departments: true,
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

    this.invalidateCache();
    return this.transformCourse(course as unknown as CourseWithRelations);
  }

  /**
   * Update course
   */
  async updateCourse(id: number, data: UpdateCourseInput): Promise<Course> {
    // If code is being updated, check for conflicts
    if (data.code) {
      const existing = await this.getCourseByCode(data.code);
      if (existing && existing.id !== id) {
        throw new Error('Bu ders kodu zaten kullanılıyor');
      }
    }

    // Delete existing sessions and departments if provided
    if (data.sessions) {
      await prisma.courseSession.deleteMany({
        where: { courseId: id },
      });
    }

    if (data.departments) {
      await prisma.courseDepartment.deleteMany({
        where: { courseId: id },
      });
    }

    const course = await prisma.course.update({
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
        ...(data.total_hours && { totalHours: data.total_hours }),
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
        sessions: true,
        departments: true,
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

    this.invalidateCache(id);
    return this.transformCourse(course as unknown as CourseWithRelations);
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
   * This returns a specific structure expected by the scheduler algorithm
   */
  async getActiveCoursesForScheduler() {
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
      teacherWorkingHours: course.teacher?.workingHours 
        ? JSON.parse(course.teacher.workingHours) 
        : {},
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
  private transformCourse(course: CourseWithRelations | MinimalCourseWithRelations): Course {
    // Check if hardcodedSchedules exists, otherwise default to empty array
    const hardcodedSchedules = 'hardcodedSchedules' in course ? course.hardcodedSchedules : [];

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
      sessions: course.sessions?.map(s => ({
        id: s.id,
        type: s.type as 'teorik' | 'lab' | 'tümü',
        hours: s.hours,
      })) || [],
      departments: course.departments?.map(d => ({
        id: d.id,
        department: d.department,
        student_count: d.studentCount,
      })) || [],
      hardcoded_schedules: hardcodedSchedules.map(h => ({
        id: h.id,
        course_id: h.courseId,
        session_type: h.sessionType as 'teorik' | 'lab',
        day: h.day,
        start_time: h.startTime,
        end_time: h.endTime,
        classroom_id: h.classroomId || undefined,
        classroom: h.classroom,
      })),
      teacher: course.teacher ? {
        id: course.teacher.id,
        name: course.teacher.name,
        title: course.teacher.title || undefined,
      } : null,
    };
  }
}

// Export singleton instance
export const courseService = new CourseService();
