import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getTeacherById, updateTeacher, deleteTeacher } from '@/lib/turso-helpers';

// GET /api/teachers/[id] - Get a single teacher
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
    const teacher = await getTeacherById(parseInt(id));

    if (!teacher) {
      return NextResponse.json({ detail: 'Öğretmen bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json(
      { detail: 'Öğretmen bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/teachers/[id] - Update a teacher
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
    const { name, email, title, faculty, department, working_hours } = body;

    const teacher = await updateTeacher(parseInt(id), { name, email, title, faculty, department, working_hours });
    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Update teacher error:', error);
    return NextResponse.json(
      { detail: 'Öğretmen güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/teachers/[id] - Delete a teacher
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
    await deleteTeacher(parseInt(id));
    return NextResponse.json({ message: 'Öğretmen silindi' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { detail: 'Öğretmen silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
