import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import logger from '@/lib/logger';
import { getClassroomSchedule } from '@/lib/turso-helpers';

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

        // Use schedule helper
        const schedules = await getClassroomSchedule(classroomId);

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
