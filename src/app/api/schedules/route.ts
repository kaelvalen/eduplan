import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/schedules - Get all schedules
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const rawSchedules = await prisma.schedule.findMany({
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true, workingHours: true } },
          },
        },
        classroom: true,
      },
      orderBy: [{ day: 'asc' }, { timeRange: 'asc' }],
    });

    const schedules = rawSchedules.map((s) => ({
      id: s.id,
      day: s.day,
      time_range: s.timeRange,
      course_id: s.courseId,
      classroom_id: s.classroomId,
      session_type: (s as any).sessionType || 'teorik',
      is_hardcoded: s.isHardcoded,
      course: s.course ? {
        id: s.course.id,
        code: s.course.code,
        name: s.course.name,
        teacher: s.course.teacher ? {
          id: s.course.teacher.id,
          name: s.course.teacher.name,
          working_hours: (s.course.teacher as { workingHours?: string }).workingHours ?? null,
        } : null,
      } : null,
      classroom: s.classroom ? {
        id: s.classroom.id,
        name: s.classroom.name,
        type: s.classroom.type,
        capacity: s.classroom.capacity,
      } : null,
    }));

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json(
      { detail: 'Ders programı yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/schedules - Create a new schedule
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    const { day, time_range, course_id, classroom_id, session_type, is_hardcoded } = body;

    const rawSchedule = await prisma.schedule.create({
      data: {
        day,
        timeRange: time_range,
        courseId: course_id,
        classroomId: classroom_id,
        sessionType: session_type || 'teorik',
        isHardcoded: is_hardcoded || false,
      },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
        classroom: true,
      },
    });

    const schedule = {
      id: rawSchedule.id,
      day: rawSchedule.day,
      time_range: rawSchedule.timeRange,
      course_id: rawSchedule.courseId,
      classroom_id: rawSchedule.classroomId,
      session_type: (rawSchedule as any).sessionType || 'teorik',
      is_hardcoded: rawSchedule.isHardcoded,
      course: rawSchedule.course ? {
        id: rawSchedule.course.id,
        code: rawSchedule.course.code,
        name: rawSchedule.course.name,
        teacher: rawSchedule.course.teacher ? {
          id: rawSchedule.course.teacher.id,
          name: rawSchedule.course.teacher.name,
        } : null,
      } : null,
      classroom: rawSchedule.classroom ? {
        id: rawSchedule.classroom.id,
        name: rawSchedule.classroom.name,
        type: rawSchedule.classroom.type,
        capacity: rawSchedule.classroom.capacity,
      } : null,
    };

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json(
      { detail: 'Program eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
