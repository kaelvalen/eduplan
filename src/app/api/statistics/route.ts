import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/statistics - Get system statistics
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Get counts for various entities
    const [
      totalCourses,
      totalTeachers,
      totalClassrooms,
      totalSchedules,
      activeCourses,
      activeTeachers,
      activeClassrooms,
    ] = await Promise.all([
      prisma.course.count(),
      prisma.teacher.count(),
      prisma.classroom.count(),
      prisma.schedule.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.teacher.count({ where: { isActive: true } }),
      prisma.classroom.count({ where: { isActive: true } }),
    ]);

    // Get total students from course departments
    const coursesWithDepartments = await prisma.course.findMany({
      where: { isActive: true },
      include: { departments: true },
    });

    const totalStudents = coursesWithDepartments.reduce((sum, course) => {
      return sum + course.departments.reduce((deptSum, dept) => deptSum + dept.studentCount, 0);
    }, 0);

    // Get classroom utilization
    const classroomUsage = await prisma.classroom.findMany({
      where: { isActive: true },
      include: {
        schedules: true,
      },
    });

    const totalCapacity = classroomUsage.reduce((sum, c) => sum + c.capacity, 0);
    const utilizationPercentage = classroomUsage.length > 0
      ? Math.round((classroomUsage.filter(c => c.schedules.length > 0).length / classroomUsage.length) * 100)
      : 0;

    const stats = {
      total_courses: totalCourses,
      total_teachers: totalTeachers,
      total_classrooms: totalClassrooms,
      total_schedules: totalSchedules,
      total_students: totalStudents,
      active_courses: activeCourses,
      active_teachers: activeTeachers,
      active_classrooms: activeClassrooms,
      classroom_utilization_percentage: utilizationPercentage,
      total_classroom_capacity: totalCapacity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    return NextResponse.json(
      { detail: 'İstatistikler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
