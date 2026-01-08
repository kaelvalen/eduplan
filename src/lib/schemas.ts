import { z } from 'zod';

// ==================== COURSE SCHEMAS ====================
export const CourseSessionSchema = z.object({
  type: z.enum(['teorik', 'lab', 'uygulama']),
  hours: z.number().min(1).max(10),
});

export const CourseDepartmentSchema = z.object({
  department: z.string().min(1),
  student_count: z.number().min(0).max(1000),
});

export const CreateCourseSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().regex(/^[A-Z]{2,4}\d{3,4}$/, 'Kod formatı hatalı (örn: CSE101)'),
  teacher_id: z.number().nullable().optional(),
  faculty: z.string().min(1),
  level: z.enum(['Lisans', 'Yüksek Lisans', 'Doktora']),
  category: z.enum(['zorunlu', 'seçmeli']),
  semester: z.string().min(1),
  ects: z.number().min(0).max(30),
  total_hours: z.number().min(0).max(100),
  is_active: z.boolean().default(true),
  sessions: z.array(CourseSessionSchema).min(1, 'En az bir oturum gerekli'),
  departments: z.array(CourseDepartmentSchema).min(1, 'En az bir bölüm gerekli'),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

// ==================== TEACHER SCHEMAS ====================
export const WorkingHoursSchema = z.record(
  z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  z.array(z.string())
);

export const CreateTeacherSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email('Geçerli bir email adresi girin'),
  title: z.enum(['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Öğr. Gör.', 'Arş. Gör.']),
  faculty: z.string().min(1),
  department: z.string().min(1),
  working_hours: WorkingHoursSchema.optional(),
});

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

// ==================== CLASSROOM SCHEMAS ====================
export const CreateClassroomSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().min(1).max(1000),
  type: z.enum(['Derslik', 'Amfi', 'Laboratuvar', 'Atölye']),
  building: z.string().min(1).max(100),
  floor: z.string().min(1).max(50),
  has_projector: z.boolean().default(false),
  has_computer: z.boolean().default(false),
  has_smartboard: z.boolean().default(false),
});

export const UpdateClassroomSchema = CreateClassroomSchema.partial();

// ==================== SCHEDULE SCHEMAS ====================
export const CreateScheduleSchema = z.object({
  day: z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  time_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Saat formatı hatalı (örn: 09:00-10:00)'),
  course_id: z.number().positive(),
  classroom_id: z.number().positive(),
});

export const BulkCreateScheduleSchema = z.array(CreateScheduleSchema);

// ==================== AUTH SCHEMAS ====================
export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

// ==================== TYPE EXPORTS ====================
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;
export type CreateClassroomInput = z.infer<typeof CreateClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof UpdateClassroomSchema>;
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
