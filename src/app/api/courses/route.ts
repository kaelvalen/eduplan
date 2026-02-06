import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services';
import { CreateCourseSchema, type CreateCourseInput } from '@/lib/schemas';
import { withAuth, withAdminAndValidation } from '@/middleware';

/**
 * GET /api/courses - Get all courses
 * Requires authentication
 */
export const GET = withAuth(async (request: NextRequest, _user) => {
  try {
    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters = {
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      faculty: searchParams.get('faculty') || undefined,
      department: searchParams.get('department') || undefined,
      teacherId: searchParams.get('teacherId') ? Number(searchParams.get('teacherId')) : undefined,
      level: searchParams.get('level') || undefined,
      category: (searchParams.get('category') as 'zorunlu' | 'secmeli') || undefined,
      searchTerm: searchParams.get('search') || undefined,
    };

    const courses = await courseService.getCourses(filters);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Dersler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/courses - Create a new course
 * Requires admin authentication and validates input
 */
export const POST = withAdminAndValidation<CreateCourseInput>(
  CreateCourseSchema,
  async (request: NextRequest, user, validated: CreateCourseInput) => {
    try {
      const course = await courseService.createCourse(validated as CreateCourseInput);
      return NextResponse.json(course, { status: 201 });
    } catch (error) {
      console.error('Create course error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Ders eklenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);
