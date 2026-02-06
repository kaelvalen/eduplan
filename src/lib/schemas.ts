import { z } from 'zod';

// ==================== AVAILABLE HOURS SCHEMA ====================
/** Schedule ile uyumlu: gün başına "09:00-10:00" formatında aralıklar */
export const AvailableHoursSchema = z.record(
  z.enum(['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma']),
  z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, 'Saat aralığı formatı hatalı (örn: 09:00-10:00)'))
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

// Base course schema without refinements (for Update to work with .partial())
const BaseCourseSchema = z.object({
  name: z.string().min(2, 'Ders adı en az 2 karakter olmalıdır').max(200, 'Ders adı en fazla 200 karakter olabilir'),
  code: z.string().regex(/^[A-Z]{2,4}\d{3,4}$/, 'Kod formatı hatalı (örn: BIL101, CENG1001)'),
  teacher_id: z.number().positive('Geçerli bir öğretmen seçin').nullable().optional(),
  faculty: z.string().min(1, 'Fakülte seçimi zorunludur'),
  level: z.enum(['1', '2', '3', '4'], 'Geçerli bir sınıf seçin (1-4)'),
  category: z.enum(['zorunlu', 'secmeli'], 'Kategori zorunlu veya seçmeli olmalıdır'),
  semester: z.string().min(1, 'Dönem seçimi zorunludur'),
  ects: z.number().min(0, 'ECTS 0\'dan küçük olamaz').max(30, 'ECTS 30\'dan büyük olamaz'),
  total_hours: z.number().min(1, 'Toplam saat en az 1 olmalıdır').max(100, 'Toplam saat 100\'den büyük olamaz'),
  capacity_margin: z.number().min(0).max(30, 'Kapasite marjı 0-30 arasında olmalıdır').default(0),
  is_active: z.boolean().default(true),
  sessions: z.array(CourseSessionSchema).min(1, 'En az bir oturum gerekli').max(10, 'En fazla 10 oturum olabilir'),
  departments: z.array(CourseDepartmentSchema).min(1, 'En az bir bölüm gerekli').max(20, 'En fazla 20 bölüm olabilir'),
});

// Create schema with refinement for validation
export const CreateCourseSchema = BaseCourseSchema.refine(
  (data) => {
    const totalSessionHours = data.sessions.reduce((sum, s) => sum + s.hours, 0);
    return totalSessionHours === data.total_hours;
  },
  {
    message: 'Oturum saatlerinin toplamı total_hours ile eşleşmelidir',
    path: ['sessions'],
  }
);

// Update schema without refinement (partial can be used)
export const UpdateCourseSchema = BaseCourseSchema.partial();

// ==================== TEACHER SCHEMAS ====================
// Base schema without refinements
const BaseTeacherSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(200, 'İsim en fazla 200 karakter olabilir'),
  email: z.string().email('Geçerli bir e-posta adresi girin').toLowerCase(),
  title: z.enum(['Prof. Dr.', 'Doç. Dr.', 'Dr. Öğr. Üyesi', 'Öğr. Gör.', 'Öğr. Gör. Dr.', 'Arş. Gör.', 'Arş. Gör. Dr.'], 'Geçerli bir akademik ünvan seçin').default('Öğr. Gör.'),
  faculty: z.string().min(1, 'Fakülte seçimi zorunludur'),
  department: z.string().min(1, 'Bölüm seçimi zorunludur'),
  working_hours: z.string().optional(),
  is_active: z.boolean().default(true),
});

// Create schema with refinement
export const CreateTeacherSchema = BaseTeacherSchema.refine(
  (data) => {
    if (!data.working_hours) return true;
    try {
      JSON.parse(data.working_hours);
      return true;
    } catch {
      return false;
    }
  },
  { message: 'Çalışma saatleri geçerli JSON formatında olmalıdır', path: ['working_hours'] }
);

// Update schema without refinement
export const UpdateTeacherSchema = BaseTeacherSchema.partial();

// ==================== CLASSROOM SCHEMAS ====================
export const CreateClassroomSchema = z.object({
  name: z.string().min(1, 'Derslik adı zorunludur').max(100, 'Derslik adı en fazla 100 karakter olabilir'),
  capacity: z.number().min(1, 'Kapasite en az 1 olmalıdır').max(1000, 'Kapasite en fazla 1000 olabilir'),
  type: z.enum(['teorik', 'lab', 'hibrit'], 'Tip teorik, lab veya hibrit olmalıdır'),
  faculty: z.string().min(1, 'Fakülte seçimi zorunludur'),
  department: z.string().min(1, 'Bölüm seçimi zorunludur'),
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
  day_start: z.string().regex(/^\d{2}:\d{2}$/).default('09:30'),
  day_end: z.string().regex(/^\d{2}:\d{2}$/).default('17:00'),
  lunch_break_start: z.string().regex(/^\d{2}:\d{2}$/).default('12:00'),
  lunch_break_end: z.string().regex(/^\d{2}:\d{2}$/).default('13:00'),
});

export const UpdateSystemSettingsSchema = SystemSettingsSchema.partial();

// ==================== AUTH SCHEMAS ====================
export const LoginSchema = z.object({
  username: z.string().min(1, 'Kullanıcı adı zorunludur'),
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

