import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllTeachers, findTeacherByEmail, createTeacher } from '@/lib/turso-helpers';
import { cache } from '@/lib/cache';
import { CreateTeacherSchema } from '@/lib/schemas';

// GET /api/teachers - Get all teachers
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Check cache first
    const cached = cache.get('teachers:all');
    if (cached) {
      return NextResponse.json(cached);
    }

    const teachers = await getAllTeachers();
    
    // Cache for 10 minutes
    cache.set('teachers:all', teachers, 600);
    
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { detail: 'Öğretmenler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/teachers - Create a new teacher
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    const body = await request.json();
    
    // Validate request body
    const validation = CreateTeacherSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          detail: 'Geçersiz veri formatı',
          errors: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }
    
    const { name, email, faculty, department, working_hours } = validation.data;

    // Check if email already exists
    const existing = await findTeacherByEmail(email);
    if (existing) {
      return NextResponse.json(
        { detail: 'Bu e-posta adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    const teacher = await createTeacher({ name, email, faculty, department, working_hours });
    
    // Invalidate teachers cache
    cache.invalidate('teachers');
    
    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Create teacher error:', error);
    return NextResponse.json(
      { detail: 'Öğretmen eklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
