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

    // Get total active courses
    const totalActiveCourses = await prisma.course.count({
      where: { isActive: true },
    });

    // Get all active courses with their sessions to calculate total active sessions
    const activeCourses = await prisma.course.findMany({
      where: { isActive: true },
      include: { sessions: true },
    });

    const totalActiveSessions = activeCourses.reduce((sum, course) => {
      return sum + course.sessions.reduce((sessionSum, session) => sessionSum + session.hours, 0);
    }, 0);

    // Get total scheduled sessions
    const scheduledSessions = await prisma.schedule.count();

    const completionPercentage = totalActiveSessions > 0
      ? Math.round((scheduledSessions / totalActiveSessions) * 100)
      : 0;

    return NextResponse.json({
      total_active_courses: totalActiveCourses,
      total_active_sessions: totalActiveSessions,
      scheduled_sessions: scheduledSessions,
      completion_percentage: completionPercentage,
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    return NextResponse.json(
      { detail: 'Durum bilgisi alınamadı' },
      { status: 500 }
    );
  }
}
