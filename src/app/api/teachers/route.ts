import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services';
import { CreateTeacherSchema } from '@/lib/schemas';
import { withAuth, withAdminAndValidation } from '@/middleware';

/**
 * GET /api/teachers - Get all teachers
 * Requires authentication
 */
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters = {
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      faculty: searchParams.get('faculty') || undefined,
      department: searchParams.get('department') || undefined,
      searchTerm: searchParams.get('search') || undefined,
    };

    const teachers = await teacherService.getTeachers(filters);
    return NextResponse.json(teachers);
  } catch (error) {
    console.error('Get teachers error:', error);
    return NextResponse.json(
      { error: 'Öğretmenler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/teachers - Create a new teacher
 * Requires admin authentication and validates input
 */
export const POST = withAdminAndValidation(
  CreateTeacherSchema,
  async (request: NextRequest, user, validated) => {
    try {
      const teacher = await teacherService.createTeacher(validated);
      return NextResponse.json(teacher, { status: 201 });
    } catch (error) {
      console.error('Create teacher error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Öğretmen eklenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);
