import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

// GET /api/teachers/[id]/schedule - Get teacher's weekly schedule
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
        const teacherId = parseInt(id, 10);

        if (isNaN(teacherId)) {
            return NextResponse.json({ detail: 'Geçersiz öğretmen ID' }, { status: 400 });
        }

        // Get teacher info
        const teacher = await prisma.teacher.findUnique({
            where: { id: teacherId },
        });

        // Get teacher's schedules
        const rawSchedules = await prisma.schedule.findMany({
            where: {
                course: {
                    teacherId: teacherId,
                },
            },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                classroom: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
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
            } : null,
            classroom: s.classroom ? {
                id: s.classroom.id,
                name: s.classroom.name,
                type: s.classroom.type,
            } : null,
        }));

        return NextResponse.json({
            teacher: teacher ? {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                title: (teacher as any).title,
                faculty: teacher.faculty,
                department: teacher.department,
                working_hours: teacher.workingHours,
                is_active: (teacher as any).isActive,
            } : null,
            schedule: schedules
        });
    } catch (error) {
        logger.error('Get teacher schedule error:', { error });
        return NextResponse.json(
            { detail: 'Öğretmen programı alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
