import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/classrooms/[id]/schedule - Get classroom's weekly schedule
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
        const classroomId = parseInt(id, 10);

        if (isNaN(classroomId)) {
            return NextResponse.json({ detail: 'Geçersiz derslik ID' }, { status: 400 });
        }

        // Get classroom info
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId },
        });

        // Get classroom schedules
        const rawSchedules = await prisma.schedule.findMany({
            where: { classroomId },
            include: {
                course: {
                    include: {
                        teacher: { select: { id: true, name: true } },
                    },
                },
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
                } : null,
            } : null,
        }));

        return NextResponse.json({
            classroom: classroom ? {
                id: classroom.id,
                name: classroom.name,
                capacity: classroom.capacity,
                type: classroom.type,
                faculty: classroom.faculty,
                department: classroom.department,
                priority_dept: (classroom as any).priorityDept,
                available_hours: (classroom as any).availableHours,
                is_active: (classroom as any).isActive,
            } : null,
            schedule: schedules
        });
    } catch (error) {
        logger.error('Get classroom schedule error:', { error });
        return NextResponse.json(
            { detail: 'Derslik programı alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
