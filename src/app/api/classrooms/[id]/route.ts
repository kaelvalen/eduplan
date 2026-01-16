import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getClassroomById, updateClassroom, deleteClassroom, countSchedulesByClassroom } from '@/lib/turso-helpers';

// GET /api/classrooms/[id] - Get a single classroom
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
    const classroom = await getClassroomById(parseInt(id));

    if (!classroom) {
      return NextResponse.json({ detail: 'Derslik bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error('Get classroom error:', error);
    return NextResponse.json(
      { detail: 'Derslik bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/classrooms/[id] - Update a classroom
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
    const { name, capacity, type, faculty, department, is_active } = body;

    const classroom = await updateClassroom(parseInt(id), { name, capacity, type, faculty, department, is_active });
    return NextResponse.json(classroom);
  } catch (error) {
    console.error('Update classroom error:', error);
    return NextResponse.json(
      { detail: 'Derslik güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/classrooms/[id] - Delete a classroom
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
    const classroomId = parseInt(id);

    // Check if classroom is used in schedules
    const scheduleCount = await countSchedulesByClassroom(classroomId);
    if (scheduleCount > 0) {
      return NextResponse.json(
        { detail: 'Bu derslik ders programında kullanılıyor, silinemez' },
        { status: 400 }
      );
    }

    await deleteClassroom(classroomId);
    return NextResponse.json({ message: 'Derslik silindi' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    return NextResponse.json(
      { detail: 'Derslik silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
