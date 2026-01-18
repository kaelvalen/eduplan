import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services';
import { UpdateTeacherSchema } from '@/lib/schemas';
import { withAuth, withAdminAndValidation, withAdmin } from '@/middleware';

/**
 * GET /api/teachers/[id] - Get teacher by ID
 * Requires authentication
 */
export const GET = withAuth(async (request: NextRequest, user, { params }: any) => {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz öğretmen ID' },
        { status: 400 }
      );
    }

    const teacher = await teacherService.getTeacherById(id);
    
    if (!teacher) {
      return NextResponse.json(
        { error: 'Öğretmen bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(teacher);
  } catch (error) {
    console.error('Get teacher error:', error);
    return NextResponse.json(
      { error: 'Öğretmen yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/teachers/[id] - Update teacher
 * Requires admin authentication and validates input
 */
export const PUT = withAdminAndValidation(
  UpdateTeacherSchema,
  async (request: NextRequest, user, validated, { params }: any) => {
    try {
      const id = Number(params.id);
      
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Geçersiz öğretmen ID' },
          { status: 400 }
        );
      }

      const teacher = await teacherService.updateTeacher(id, validated);
      return NextResponse.json(teacher);
    } catch (error) {
      console.error('Update teacher error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Öğretmen güncellenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);

/**
 * DELETE /api/teachers/[id] - Delete teacher
 * Requires admin authentication
 */
export const DELETE = withAdmin(async (request: NextRequest, user, { params }: any) => {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Geçersiz öğretmen ID' },
        { status: 400 }
      );
    }

    await teacherService.deleteTeacher(id);
    return NextResponse.json({ message: 'Öğretmen başarıyla silindi' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Öğretmen silinirken bir hata oluştu' },
      { status: error instanceof Error && error.message.includes('dersleri') ? 400 : 500 }
    );
  }
});
