import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/scheduler/status - Get scheduling status
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Get all active courses with their sessions
    const activeCourses = await prisma.course.findMany({
      where: { isActive: true },
      include: { sessions: true },
    });

    const totalActiveCourses = activeCourses.length;
    const totalRequiredHours = activeCourses.reduce(
      (sum, course) => sum + course.sessions.reduce((s, sess) => s + sess.hours, 0),
      0
    );

    // Get scheduled hours per course and totals
    const scheduleRows = await prisma.schedule.findMany({
      select: { courseId: true, sessionHours: true },
    });

    const scheduledHoursByCourse = new Map<number, number>();
    let totalScheduledHours = 0;
    for (const row of scheduleRows) {
      const cur = scheduledHoursByCourse.get(row.courseId) ?? 0;
      scheduledHoursByCourse.set(row.courseId, cur + row.sessionHours);
      totalScheduledHours += row.sessionHours;
    }

    let fullyScheduledCourses = 0;
    for (const course of activeCourses) {
      const required = course.sessions.reduce((s, sess) => s + sess.hours, 0);
      const scheduled = scheduledHoursByCourse.get(course.id) ?? 0;
      if (scheduled >= required) fullyScheduledCourses++;
    }

    const scheduledSessions = scheduleRows.length;
    const totalActiveSessions = totalRequiredHours; // legacy: "total required" session-hours
    const completionPercentage =
      totalRequiredHours > 0
        ? Math.round((totalScheduledHours / totalRequiredHours) * 100)
        : 0;

    return NextResponse.json({
      total_active_courses: totalActiveCourses,
      total_active_sessions: totalActiveSessions,
      scheduled_sessions: scheduledSessions,
      completion_percentage: completionPercentage,
      fully_scheduled_courses: fullyScheduledCourses,
      total_required_hours: totalRequiredHours,
      total_scheduled_hours: totalScheduledHours,
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    return NextResponse.json(
      { detail: 'Durum bilgisi alınamadı' },
      { status: 500 }
    );
  }
}
