import { NextRequest, NextResponse } from 'next/server';
import { classroomService } from '@/services';
import { CreateClassroomSchema } from '@/lib/schemas';
import { withAuth, withAdminAndValidation } from '@/middleware';

/**
 * GET /api/classrooms - Get all classrooms
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
      type: (searchParams.get('type') as 'teorik' | 'lab') || undefined,
      searchTerm: searchParams.get('search') || undefined,
    };

    const classrooms = await classroomService.getClassrooms(filters);
    return NextResponse.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    return NextResponse.json(
      { error: 'Derslikler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/classrooms - Create a new classroom
 * Requires admin authentication and validates input
 */
export const POST = withAdminAndValidation(
  CreateClassroomSchema,
  async (request: NextRequest, user, validated) => {
    try {
      const classroom = await classroomService.createClassroom(validated);
      return NextResponse.json(classroom, { status: 201 });
    } catch (error) {
      console.error('Create classroom error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Derslik eklenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);
