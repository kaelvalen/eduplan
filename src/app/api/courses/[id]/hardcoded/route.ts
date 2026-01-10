import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { HardcodedScheduleSchema } from '@/lib/schemas';
import logger from '@/lib/logger';

// GET /api/courses/[id]/hardcoded - Get hardcoded schedules for a course
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
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ detail: 'Geçersiz ders ID' }, { status: 400 });
        }

        const hardcodedSchedules = await prisma.hardcodedSchedule.findMany({
            where: { courseId },
            include: {
                classroom: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        });

        return NextResponse.json(
            hardcodedSchedules.map((hs) => ({
                id: hs.id,
                course_id: hs.courseId,
                session_type: hs.sessionType,
                day: hs.day,
                start_time: hs.startTime,
                end_time: hs.endTime,
                classroom_id: hs.classroomId,
                classroom: hs.classroom,
            }))
        );
    } catch (error) {
        logger.error('Get hardcoded schedules error:', { error });
        return NextResponse.json(
            { detail: 'Sabit programlar alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// POST /api/courses/[id]/hardcoded - Create hardcoded schedule for a course
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser(request);
        if (!user || !isAdmin(user)) {
            return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
        }

        const { id } = await params;
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ detail: 'Geçersiz ders ID' }, { status: 400 });
        }

        // Check if course exists
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) {
            return NextResponse.json({ detail: 'Ders bulunamadı' }, { status: 404 });
        }

        const body = await request.json();
        const validation = HardcodedScheduleSchema.safeParse({ ...body, course_id: courseId });

        if (!validation.success) {
            return NextResponse.json(
                { detail: 'Geçersiz veri', errors: validation.error.issues },
                { status: 400 }
            );
        }

        const { session_type, day, start_time, end_time, classroom_id } = validation.data;

        // Check for time conflicts with existing hardcoded schedules
        const existingSchedules = await prisma.hardcodedSchedule.findMany({
            where: {
                courseId,
                day,
            },
        });

        const hasConflict = existingSchedules.some((existing) => {
            const existingStart = existing.startTime;
            const existingEnd = existing.endTime;
            return (
                (start_time >= existingStart && start_time < existingEnd) ||
                (end_time > existingStart && end_time <= existingEnd) ||
                (start_time <= existingStart && end_time >= existingEnd)
            );
        });

        if (hasConflict) {
            return NextResponse.json(
                { detail: 'Bu zaman aralığında başka bir sabit program var' },
                { status: 400 }
            );
        }

        const hardcodedSchedule = await prisma.hardcodedSchedule.create({
            data: {
                courseId,
                sessionType: session_type,
                day,
                startTime: start_time,
                endTime: end_time,
                classroomId: classroom_id,
            },
            include: {
                classroom: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        logger.info('Hardcoded schedule created:', { hardcodedSchedule });

        return NextResponse.json(
            {
                id: hardcodedSchedule.id,
                course_id: hardcodedSchedule.courseId,
                session_type: hardcodedSchedule.sessionType,
                day: hardcodedSchedule.day,
                start_time: hardcodedSchedule.startTime,
                end_time: hardcodedSchedule.endTime,
                classroom_id: hardcodedSchedule.classroomId,
                classroom: hardcodedSchedule.classroom,
            },
            { status: 201 }
        );
    } catch (error) {
        logger.error('Create hardcoded schedule error:', { error });
        return NextResponse.json(
            { detail: 'Sabit program oluşturulurken bir hata oluştu' },
            { status: 500 }
        );
    }
}

// DELETE /api/courses/[id]/hardcoded - Delete all hardcoded schedules for a course
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
        const courseId = parseInt(id, 10);

        if (isNaN(courseId)) {
            return NextResponse.json({ detail: 'Geçersiz ders ID' }, { status: 400 });
        }

        // Check for scheduleId in query params for single delete
        const url = new URL(request.url);
        const scheduleId = url.searchParams.get('scheduleId');

        if (scheduleId) {
            const scheduleIdNum = parseInt(scheduleId, 10);
            if (isNaN(scheduleIdNum)) {
                return NextResponse.json({ detail: 'Geçersiz program ID' }, { status: 400 });
            }

            await prisma.hardcodedSchedule.delete({
                where: { id: scheduleIdNum },
            });

            logger.info('Hardcoded schedule deleted:', { scheduleId: scheduleIdNum });
            return NextResponse.json({ message: 'Sabit program silindi' });
        }

        // Delete all hardcoded schedules for the course
        const result = await prisma.hardcodedSchedule.deleteMany({
            where: { courseId },
        });

        logger.info('All hardcoded schedules deleted for course:', { courseId, count: result.count });
        return NextResponse.json({ message: `${result.count} sabit program silindi` });
    } catch (error) {
        logger.error('Delete hardcoded schedule error:', { error });
        return NextResponse.json(
            { detail: 'Sabit program silinirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
