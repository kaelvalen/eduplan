/**
 * Service Layer Exports
 * Central export point for all services
 */

export { BaseService } from './base.service';
export { CourseService, courseService } from './course.service';
export { TeacherService, teacherService } from './teacher.service';
export { ClassroomService, classroomService } from './classroom.service';

export type { CourseFilters } from './course.service';
export type { TeacherFilters } from './teacher.service';
export type { ClassroomFilters } from './classroom.service';
