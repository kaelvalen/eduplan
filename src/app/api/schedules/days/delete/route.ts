import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/schedules/days/delete - Delete schedules by days
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    const { days } = body;

    if (!days || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { detail: 'Silinecek günler belirtilmeli' },
        { status: 400 }
      );
    }

    await prisma.schedule.deleteMany({
      where: {
        day: {
          in: days,
        },
      },
    });

    return NextResponse.json({ message: 'Programlar silindi' });
  } catch (error) {
    console.error('Delete schedules by days error:', error);
    return NextResponse.json(
      { detail: 'Programlar silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
