import { NextRequest, NextResponse } from 'next/server';
import { courseService } from '@/services';
import { UpdateCourseSchema, type UpdateCourseInput } from '@/lib/schemas';
import { withAuth, withAdminAndValidation, withAdmin } from '@/middleware';

/**
 * GET /api/courses/[id] - Get course by ID
 * Requires authentication
 */
export const GET = withAuth(async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
  try {
    // Next.js 15+: params is a Promise
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ders ID' },
        { status: 400 }
      );
    }

    const course = await courseService.getCourseById(id);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Ders bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: 'Ders yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/courses/[id] - Update course
 * Requires admin authentication and validates input
 */
export const PUT = withAdminAndValidation<UpdateCourseInput>(
  UpdateCourseSchema,
  async (request: NextRequest, user, validated: UpdateCourseInput, context: { params: Promise<{ id: string }> }) => {
    try {
      // Next.js 15+: params is a Promise
      const { params } = context;
      const resolvedParams = await params;
      const id = Number(resolvedParams.id);
      
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Geçersiz ders ID' },
          { status: 400 }
        );
      }

      const course = await courseService.updateCourse(id, validated as UpdateCourseInput);
      return NextResponse.json(course);
    } catch (error) {
      console.error('Update course error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Ders güncellenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);

/**
 * DELETE /api/courses/[id] - Delete course
 * Requires admin authentication
 */
export const DELETE = withAdmin(async (request: NextRequest, user, context: { params: Promise<{ id: string }> }) => {
  try {
    // Next.js 15+: params is a Promise
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz ders ID' },
        { status: 400 }
      );
    }

    await courseService.deleteCourse(id);
    return NextResponse.json({ message: 'Ders başarıyla silindi' });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ders silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
});
