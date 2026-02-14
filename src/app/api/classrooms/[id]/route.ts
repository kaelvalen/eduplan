import { NextRequest, NextResponse } from 'next/server';
import { classroomService } from '@/services';
import { UpdateClassroomSchema, type UpdateClassroomInput } from '@/lib/schemas';
import { withAuth, withAdminAndValidation, withAdmin } from '@/middleware';

/**
 * GET /api/classrooms/[id] - Get classroom by ID
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
        { error: 'Geçersiz derslik ID' },
        { status: 400 }
      );
    }

    const classroom = await classroomService.getClassroomById(id);
    
    if (!classroom) {
      return NextResponse.json(
        { error: 'Derslik bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(classroom);
  } catch (error) {
    console.error('Get classroom error:', error);
    return NextResponse.json(
      { error: 'Derslik yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/classrooms/[id] - Update classroom
 * Requires admin authentication and validates input
 */
export const PUT = withAdminAndValidation<UpdateClassroomInput>(
  UpdateClassroomSchema,
  async (request: NextRequest, user, validated, context: { params: Promise<{ id: string }> }) => {
    try {
      // Next.js 15+: params is a Promise
      const { params } = context;
      const resolvedParams = await params;
      const id = Number(resolvedParams.id);
      
      if (isNaN(id)) {
        return NextResponse.json(
          { error: 'Geçersiz derslik ID' },
          { status: 400 }
        );
      }

      const classroom = await classroomService.updateClassroom(id, validated as UpdateClassroomInput);
      return NextResponse.json(classroom);
    } catch (error) {
      console.error('Update classroom error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Derslik güncellenirken bir hata oluştu' },
        { status: error instanceof Error && error.message.includes('zaten') ? 400 : 500 }
      );
    }
  }
);

/**
 * DELETE /api/classrooms/[id] - Delete classroom
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
        { error: 'Geçersiz derslik ID' },
        { status: 400 }
      );
    }

    await classroomService.deleteClassroom(id);
    return NextResponse.json({ message: 'Derslik başarıyla silindi' });
  } catch (error) {
    console.error('Delete classroom error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Derslik silinirken bir hata oluştu' },
      { status: error instanceof Error && error.message.includes('programları') ? 400 : 500 }
    );
  }
});
