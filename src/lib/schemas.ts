import { z } from 'zod';

// ==================== AVAILABLE HOURS SCHEMA ====================
export const AvailableHoursSchema = z.record(
  z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  z.array(z.string().regex(/^\d{2}:\d{2}$/, 'Saat formatı hatalı (örn: 09:00)'))
);

// ==================== COURSE SCHEMAS ====================
export const CourseSessionSchema = z.object({
  type: z.enum(['teorik', 'lab', 'tümü']),
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
  capacity_margin: z.number().min(0).max(30).default(0), // Opsiyonel kapasite marjı
  is_active: z.boolean().default(true),
  sessions: z.array(CourseSessionSchema).min(1, 'En az bir oturum gerekli'),
  departments: z.array(CourseDepartmentSchema).min(1, 'En az bir bölüm gerekli'),
});

export const UpdateCourseSchema = CreateCourseSchema.partial();

// ==================== TEACHER SCHEMAS ====================
export const CreateTeacherSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email('Geçerli bir email adresi girin'),
  title: z.string().default('Öğr. Gör.'), // Akademik ünvan, default to "Öğr. Gör."
  faculty: z.string().min(1),
  department: z.string().min(1),
  working_hours: z.string().optional(), // JSON string
  is_active: z.boolean().default(true),
});

export const UpdateTeacherSchema = CreateTeacherSchema.partial();

// ==================== CLASSROOM SCHEMAS ====================
export const CreateClassroomSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.number().min(1).max(1000),
  type: z.enum(['teorik', 'lab']),
  faculty: z.string().min(1),
  department: z.string().min(1),
  priority_dept: z.string().optional(),
  available_hours: AvailableHoursSchema.optional(),
  is_active: z.boolean().default(true),
});

export const UpdateClassroomSchema = CreateClassroomSchema.partial();

// ==================== HARDCODED SCHEDULE SCHEMAS ====================
export const HardcodedScheduleSchema = z.object({
  course_id: z.number().positive(),
  session_type: z.enum(['teorik', 'lab']),
  day: z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Saat formatı hatalı (örn: 09:00)'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Saat formatı hatalı (örn: 10:00)'),
  classroom_id: z.number().positive().optional(),
});

export const CreateHardcodedScheduleSchema = HardcodedScheduleSchema;

// ==================== SCHEDULE SCHEMAS ====================
export const CreateScheduleSchema = z.object({
  day: z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  time_range: z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Saat formatı hatalı (örn: 09:00-10:00)'),
  course_id: z.number().positive(),
  classroom_id: z.number().positive(),
  is_hardcoded: z.boolean().default(false),
  session_type: z.enum(['teorik', 'lab']).default('teorik'),
});

export const BulkCreateScheduleSchema = z.array(CreateScheduleSchema);

// ==================== SYSTEM SETTINGS SCHEMAS ====================
export const SystemSettingsSchema = z.object({
  capacity_margin_enabled: z.boolean().default(false),
  capacity_margin_percent: z.number().min(0).max(30).default(0),
  // Time configuration
  slot_duration: z.number().min(30).max(60).default(60),
  day_start: z.string().regex(/^\d{2}:\d{2}$/).default('08:00'),
  day_end: z.string().regex(/^\d{2}:\d{2}$/).default('18:00'),
  lunch_break_start: z.string().regex(/^\d{2}:\d{2}$/).default('12:00'),
  lunch_break_end: z.string().regex(/^\d{2}:\d{2}$/).default('13:00'),
});

export const UpdateSystemSettingsSchema = SystemSettingsSchema.partial();

// ==================== AUTH SCHEMAS ====================
export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

// ==================== FILTER SCHEMAS ====================
export const FilterSchema = z.object({
  is_active: z.boolean().nullable().optional(),
  faculty: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  search_term: z.string().optional(),
});

// ==================== TYPE EXPORTS ====================
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type CreateTeacherInput = z.infer<typeof CreateTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof UpdateTeacherSchema>;
export type CreateClassroomInput = z.infer<typeof CreateClassroomSchema>;
export type UpdateClassroomInput = z.infer<typeof UpdateClassroomSchema>;
export type CreateScheduleInput = z.infer<typeof CreateScheduleSchema>;
export type HardcodedScheduleInput = z.infer<typeof HardcodedScheduleSchema>;
export type SystemSettingsInput = z.infer<typeof SystemSettingsSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type AvailableHoursInput = z.infer<typeof AvailableHoursSchema>;
export type FilterInput = z.infer<typeof FilterSchema>;

