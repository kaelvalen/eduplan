import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { deleteSchedule, updateSchedule } from '@/lib/turso-helpers';
import { prisma } from '@/lib/db';

// GET /api/schedules/[id] - Get a schedule by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;
    const s = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true, workingHours: true } },
            departments: true,
            sessions: true,
          },
        },
        classroom: true,
      },
    });

    if (!s) {
      return NextResponse.json({ detail: 'Program bulunamadı' }, { status: 404 });
    }

    const schedule = {
      id: s.id,
      day: s.day,
      time_range: s.timeRange,
      course_id: s.courseId,
      classroom_id: s.classroomId,
      session_type: (s as any).sessionType,
      is_hardcoded: s.isHardcoded,
      course: s.course ? {
        id: s.course.id,
        code: s.course.code,
        name: s.course.name,
        teacher_id: s.course.teacherId,
        faculty: s.course.faculty,
        level: s.course.level,
        category: s.course.category,
        semester: s.course.semester,
        ects: s.course.ects,
        is_active: s.course.isActive,
        total_hours: s.course.totalHours,
        teacher: s.course.teacher ? {
          id: s.course.teacher.id,
          name: s.course.teacher.name,
          working_hours: s.course.teacher.workingHours,
        } : null,
        departments: s.course.departments.map((d: any) => ({
          id: d.id, department: d.department, student_count: d.studentCount,
        })),
        sessions: s.course.sessions.map((sess: any) => ({
          id: sess.id, type: sess.type, hours: sess.hours,
        })),
      } : null,
      classroom: s.classroom ? {
        id: s.classroom.id,
        name: s.classroom.name,
        type: s.classroom.type,
        capacity: s.classroom.capacity,
        faculty: s.classroom.faculty,
        department: s.classroom.department,
        available_hours: s.classroom.availableHours,
      } : null,
    };

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { detail: 'Program yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - Update a schedule
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateSchedule(parseInt(id), body);

    if (!updated) {
      return NextResponse.json({ detail: 'Program bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update schedule error:', error);
    return NextResponse.json(
      { detail: 'Program güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - Delete a schedule
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const { id } = await params;
    await deleteSchedule(parseInt(id));
    return NextResponse.json({ message: 'Program silindi' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return NextResponse.json(
      { detail: 'Program silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
