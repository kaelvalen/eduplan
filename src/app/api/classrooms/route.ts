import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllClassrooms, findClassroomByNameAndDept, createClassroom } from '@/lib/turso-helpers';

// GET /api/classrooms - Get all classrooms
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const classrooms = await getAllClassrooms();
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    return NextResponse.json(
      { detail: 'Derslikler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/classrooms - Create a new classroom
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    const { name, capacity, type, faculty, department, is_active } = body;

    // Check if classroom already exists in this department
    const existing = await findClassroomByNameAndDept(name, department);
    if (existing) {
      return NextResponse.json(
        { detail: 'Bu derslik zaten bu bölümde mevcut' },
        { status: 400 }
      );
    }

    const classroom = await createClassroom({ name, capacity, type, faculty, department, is_active });
    return NextResponse.json(classroom);
  } catch (error) {
    console.error('Create classroom error:', error);
    return NextResponse.json(
      { detail: 'Derslik eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
