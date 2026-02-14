import type { Schedule, Teacher, Classroom, Course } from '@/types';
import { normalizeToRanges } from '@/lib/time-utils';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * "09:00-10:00" formatındaki aralıkları [dakika, dakika] çiftlerine çevirir.
 */
function parseRangesToMinutes(dayHours: string[]): [number, number][] {
  const out: [number, number][] = [];
  for (const r of dayHours) {
    const parts = String(r).split('-').map((t) => t.trim());
    if (parts.length !== 2) continue;
    const a = timeToMinutes(parts[0]);
    const b = timeToMinutes(parts[1]);
    if (a < b) out.push([a, b]);
  }
  return out;
}

/**
 * Örtüşen veya bitişik aralıkları birleştirir.
 * Örn: [08:00-09:00, 09:00-10:00, 10:00-11:00] → [08:00-11:00]
 */
function mergeRanges(intervals: [number, number][]): [number, number][] {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [[sorted[0][0], sorted[0][1]]];
  for (let i = 1; i < sorted.length; i++) {
    const [s, e] = sorted[i];
    const last = merged[merged.length - 1];
    if (s <= last[1]) {
      last[1] = Math.max(last[1], e);
    } else {
      merged.push([s, e]);
    }
  }
  return merged;
}

/**
 * Ders saati (startTime–endTime) uygunluk aralıkları içinde mi?
 * dayHours: "09:00-10:00" formatında aralıklar. Ardışık bloklar birleştirilir;
 * örn. 14:00-15:00 ve 15:00-16:00 varsa 14:00-16:00 müsait sayılır.
 */
function isTimeSlotWithinHours(
  dayHours: string[],
  startTime: string,
  endTime: string
): boolean {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const intervals = parseRangesToMinutes(dayHours);
  const merged = mergeRanges(intervals);
  return merged.some(([a, b]) => startMin >= a && endMin <= b);
}

// Day name mapping: Turkish -> lowercase English (for backend)
const DAY_TO_ENGLISH: Record<string, string> = {
  'Pazartesi': 'monday',
  'Salı': 'tuesday',
  'Çarşamba': 'wednesday',
  'Perşembe': 'thursday',
  'Cuma': 'friday',
  'Cumartesi': 'saturday',
  'Pazar': 'sunday',
};

// Reverse mapping: English -> Turkish (for error messages)
const ENGLISH_TO_DAY: Record<string, string> = {
  'monday': 'Pazartesi',
  'tuesday': 'Salı',
  'wednesday': 'Çarşamba',
  'thursday': 'Perşembe',
  'friday': 'Cuma',
  'saturday': 'Cumartesi',
  'sunday': 'Pazar',
};

// Helper to get all possible day name variations
function getAllDayVariations(day: string): string[] {
  const variations = new Set<string>();
  
  // Add original
  variations.add(day);
  
  // Add lowercase English (backend format)
  const englishLower = DAY_TO_ENGLISH[day];
  if (englishLower) {
    variations.add(englishLower);
  }
  
  // Add other variations
  variations.add(day.toLowerCase());
  variations.add(day.toUpperCase());
  variations.add(day.charAt(0).toUpperCase() + day.slice(1).toLowerCase());
  
  // Add English variations if input is Turkish
  if (englishLower) {
    variations.add(englishLower.toUpperCase());
    variations.add(englishLower.charAt(0).toUpperCase() + englishLower.slice(1));
  }
  
  return Array.from(variations);
}

/**
 * Check if teacher is available at the given time slot
 */
export function validateTeacherAvailability(
  teacher: Teacher | null | undefined,
  day: string,
  startTime: string,
  endTime: string,
  schedules: Schedule[],
  excludeScheduleId?: number
): ValidationResult {
  const errors: string[] = [];

  if (!teacher) {
    return { valid: true, errors: [] };
  }

  if (!teacher.working_hours) {
    errors.push(`⚠️ ${teacher.name} için çalışma saatleri tanımlanmamış. Yine de devam edilebilir.`);
  }

  if (teacher.working_hours) {
    try {
      const workingHours = typeof teacher.working_hours === 'string' 
        ? JSON.parse(teacher.working_hours) 
        : teacher.working_hours;
      
      const possibleDayNames = getAllDayVariations(day);
      let dayHours: string[] | null = null;
      for (const dayName of possibleDayNames) {
        if (workingHours[dayName] && Array.isArray(workingHours[dayName])) {
          dayHours = normalizeToRanges(workingHours[dayName]);
          break;
        }
      }

      if (!dayHours || dayHours.length === 0) {
        const daysWithSlots = Object.entries(workingHours)
          .filter(([, slots]) => Array.isArray(slots) && slots.length > 0)
          .map(([d]) => ENGLISH_TO_DAY[d.toLowerCase()] || d);
        const availableDays = daysWithSlots.length > 0 ? daysWithSlots.join(', ') : 'Yok';
        errors.push(`⚠️ ${teacher.name} ${day} günü müsait değil veya bu gün için saat tanımlanmamış (Müsait günler: ${availableDays})`);
        return { valid: false, errors };
      }

      const isWithinWorkingHours = isTimeSlotWithinHours(dayHours, startTime, endTime);

      if (!isWithinWorkingHours) {
        errors.push(
          buildUnavailableMessage({
            name: teacher.name,
            startTime,
            endTime,
            dayHours,
            isTeacher: true,
          })
        );
      }
    } catch {
      // Invalid JSON, skip validation
    }
  }

  // Check for conflicts with other schedules
  const teacherSchedules = schedules.filter(
    (s) =>
      s.course?.teacher_id === teacher.id &&
      s.day === day &&
      s.id !== excludeScheduleId
  );

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  for (const schedule of teacherSchedules) {
    const [sStart, sEnd] = (schedule.time_range || '').split('-');
    const sStartMin = timeToMinutes(sStart.trim());
    const sEndMin = timeToMinutes(sEnd.trim());

    // Check for overlap
    if (startMin < sEndMin && endMin > sStartMin) {
      errors.push(
        `${teacher.name} bu saatte başka bir dersi var: ${schedule.course?.code} (${schedule.time_range})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if classroom is available at the given time slot
 */
export function validateClassroomAvailability(
  classroom: Classroom | null | undefined,
  day: string,
  startTime: string,
  endTime: string,
  schedules: Schedule[],
  excludeScheduleId?: number
): ValidationResult {
  const errors: string[] = [];

  if (!classroom) {
    errors.push('⚠️ Derslik seçilmedi');
    return { valid: false, errors };
  }

  // Check if available hours are defined
  if (!classroom.available_hours) {
    // Optional: skip validation when not defined
  } else {
    let availableHours: Record<string, string[]> | null = null;
    try {
      availableHours = typeof classroom.available_hours === 'string'
        ? JSON.parse(classroom.available_hours)
        : classroom.available_hours;
    } catch {
      availableHours = null;
    }

    if (availableHours && typeof availableHours === 'object' && Object.keys(availableHours).length > 0) {
      const possibleDayNames = getAllDayVariations(day);
      let dayHours: string[] | null = null;
      for (const dayName of possibleDayNames) {
        if (availableHours[dayName] && Array.isArray(availableHours[dayName]) && availableHours[dayName].length > 0) {
          dayHours = normalizeToRanges(availableHours[dayName]);
          break;
        }
      }

      if (!dayHours || dayHours.length === 0) {
        const availableDays = Object.keys(availableHours)
          .filter(k => {
            const hours = availableHours[k];
            return hours && Array.isArray(hours) && hours.length > 0;
          })
          .map(d => ENGLISH_TO_DAY[d.toLowerCase()] || d);
        if (availableDays.length > 0) {
          errors.push(`${classroom.name} ${day} günü kullanılamıyor (Müsait günler: ${availableDays.join(', ')})`);
        }
      } else {
        const isWithinAvailableHours = isTimeSlotWithinHours(dayHours, startTime, endTime);
        if (!isWithinAvailableHours) {
          errors.push(
            buildUnavailableMessage({
              name: classroom.name,
              startTime,
              endTime,
              dayHours,
              isTeacher: false,
            })
          );
        }
      }
    }
  }

  // Check for conflicts with other schedules
  const classroomSchedules = schedules.filter(
    (s) => s.classroom_id === classroom.id && s.day === day && s.id !== excludeScheduleId
  );

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  for (const schedule of classroomSchedules) {
    const [sStart, sEnd] = (schedule.time_range || '').split('-');
    const sStartMin = timeToMinutes(sStart.trim());
    const sEndMin = timeToMinutes(sEnd.trim());

    // Check for overlap
    if (startMin < sEndMin && endMin > sStartMin) {
      errors.push(
        `${classroom.name} bu saatte başka bir ders için kullanılıyor: ${schedule.course?.code} (${schedule.time_range})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check for conflicts with same department/level courses
 */
export function validateDepartmentConflicts(
  course: Course | null | undefined,
  day: string,
  startTime: string,
  endTime: string,
  schedules: Schedule[],
  excludeScheduleId?: number
): ValidationResult {
  const errors: string[] = [];

  if (!course) {
    return { valid: true, errors: [] };
  }

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // Get all schedules for same department and level on the same day
  const conflictingSchedules = schedules.filter((s) => {
    if (s.id === excludeScheduleId || s.day !== day || !s.course) return false;

    // Check if courses share any department
    const sharedDept = course.departments?.some((cd) =>
      s.course?.departments?.some((sd) => sd.department === cd.department)
    );

    // Check if same level
    const sameLevel = course.level === s.course.level;

    return sharedDept && sameLevel;
  });

  for (const schedule of conflictingSchedules) {
    const [sStart, sEnd] = (schedule.time_range || '').split('-');
    const sStartMin = timeToMinutes(sStart.trim());
    const sEndMin = timeToMinutes(sEnd.trim());

    // Check for overlap
    if (startMin < sEndMin && endMin > sStartMin) {
      const deptNames = course.departments
        ?.filter((cd) => schedule.course?.departments?.some((sd) => sd.department === cd.department))
        .map((cd) => cd.department)
        .join(', ');

      errors.push(
        `Çakışma: ${schedule.course?.code} dersi ile aynı bölüm/sınıfta (${deptNames} - ${course.level}. Sınıf) çakışıyor (${schedule.time_range})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/** Dakika → "HH:MM" */
function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Öğle arası: 12:00-13:00 (dakika) */
const LUNCH_START_MIN = 12 * 60;
const LUNCH_END_MIN = 13 * 60;

/**
 * Müsait değil / kullanılamıyor uyarı metnini üretir.
 * Birleştirilmiş bloklar kullanır (08:00-12:00, 13:00-18:00) ve
 * seçilen aralık öğle arasına denk geliyorsa özel ifade ekler.
 */
function buildUnavailableMessage(opts: {
  name: string;
  startTime: string;
  endTime: string;
  dayHours: string[];
  isTeacher: boolean;
}): string {
  const { name, startTime, endTime, dayHours, isTeacher } = opts;
  const intervals = parseRangesToMinutes(dayHours);
  const merged = mergeRanges(intervals);
  const blocksStr = merged
    .map(([a, b]) => `${minutesToTime(a)}-${minutesToTime(b)}`)
    .join(', ');

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const spansLunch = startMin < LUNCH_END_MIN && endMin > LUNCH_START_MIN;

  const action = isTeacher ? 'müsait değil' : 'kullanılamıyor';
  let msg = `${name} bu saatte (${startTime}-${endTime}) ${action}. `;
  if (spansLunch) {
    msg += 'Öğle arası (12:00-13:00) bu saat dilimine denk geliyor. ';
  }
  msg += `Müsait bloklar: ${blocksStr}`;
  return msg;
}
