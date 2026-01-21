import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { deleteSchedule, updateSchedule, getAllSchedules } from '@/lib/turso-helpers';

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
    const schedules = await getAllSchedules();
    const schedule = schedules.find((s: any) => s.id === parseInt(id));

    if (!schedule) {
      return NextResponse.json({ detail: 'Program bulunamadı' }, { status: 404 });
    }

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

    console.log('📝 Updating schedule:', { id, body });

    const updated = await updateSchedule(parseInt(id), body);

    if (!updated) {
      return NextResponse.json({ detail: 'Program bulunamadı' }, { status: 404 });
    }

    console.log('✅ Schedule updated:', updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('❌ Update schedule error:', error);
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
