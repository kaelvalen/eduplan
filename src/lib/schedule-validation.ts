import type { Schedule, Teacher, Classroom, Course } from '@/types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
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

  console.log('🔍 validateTeacherAvailability called:', {
    teacher: teacher?.name,
    day,
    time: `${startTime}-${endTime}`,
    hasWorkingHours: !!teacher?.working_hours,
    workingHoursType: typeof teacher?.working_hours,
  });

  if (!teacher) {
    console.log('⚠️ No teacher provided, skipping validation');
    return { valid: true, errors: [] };
  }

  // Check if working hours are defined
  if (!teacher.working_hours) {
    errors.push(`⚠️ ${teacher.name} için çalışma saatleri tanımlanmamış. Yine de devam edilebilir.`);
    console.log('⚠️ No working hours defined for teacher');
  }

  // Check working hours
  if (teacher.working_hours) {
    try {
      console.log('📝 Raw working_hours:', teacher.working_hours);
      const workingHours = typeof teacher.working_hours === 'string' 
        ? JSON.parse(teacher.working_hours) 
        : teacher.working_hours;
      console.log('📋 Parsed working hours:', workingHours);
      console.log('📋 Available keys in working hours:', Object.keys(workingHours));
      
      // Try all possible day name variations
      const possibleDayNames = getAllDayVariations(day);
      console.log('🔍 Trying day variations:', possibleDayNames);
      
      let dayHours = null;
      for (const dayName of possibleDayNames) {
        if (workingHours[dayName]) {
          dayHours = workingHours[dayName];
          console.log('✅ Found match with:', dayName);
          break;
        }
      }
      
      console.log('📅 Day hours for', day, ':', dayHours);

      if (!dayHours || dayHours.length === 0) {
        console.log('❌ No hours found for any day variation');
        // Convert English day names to Turkish for display
        const availableDays = Object.keys(workingHours)
          .map(d => ENGLISH_TO_DAY[d.toLowerCase()] || d)
          .join(', ');
        errors.push(`${teacher.name} ${day} günü çalışmıyor (Çalışma günleri: ${availableDays})`);
        return { valid: false, errors };
      }

      // Check if time slot is within working hours
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);

      const isWithinWorkingHours = dayHours.some((timeRange: string) => {
        const [wStart, wEnd] = timeRange.split('-');
        const wStartMin = timeToMinutes(wStart);
        const wEndMin = timeToMinutes(wEnd);

        return startMin >= wStartMin && endMin <= wEndMin;
      });

      if (!isWithinWorkingHours) {
        errors.push(
          `${teacher.name} bu saatte (${startTime}-${endTime}) müsait değil. Müsait saatler: ${dayHours.join(', ')}`
        );
      }
    } catch (e) {
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

  console.log('🏫 validateClassroomAvailability called:', {
    classroom: classroom?.name,
    day,
    time: `${startTime}-${endTime}`,
    hasAvailableHours: !!classroom?.available_hours,
    availableHoursType: typeof classroom?.available_hours,
    rawAvailableHours: classroom?.available_hours,
  });

  if (!classroom) {
    errors.push('⚠️ Derslik seçilmedi');
    return { valid: false, errors };
  }

  // Check if available hours are defined
  if (!classroom.available_hours) {
    errors.push(`⚠️ ${classroom.name} için müsait saatler tanımlanmamış. Yine de devam edilebilir.`);
    return { valid: false, errors };
  }

  // Parse available_hours if it's a string
  let availableHours: any;
  try {
    availableHours = typeof classroom.available_hours === 'string'
      ? JSON.parse(classroom.available_hours)
      : classroom.available_hours;
    console.log('📋 Parsed available hours:', availableHours);
    console.log('📋 Available keys:', Object.keys(availableHours));
  } catch (e) {
    console.error('❌ Failed to parse available_hours:', e);
    errors.push(`⚠️ ${classroom.name} için müsait saatler hatalı formatta`);
    return { valid: false, errors };
  }

  // Check available hours
  if (availableHours && typeof availableHours === 'object') {
    // Try all possible day name variations
    const possibleDayNames = getAllDayVariations(day);
    console.log('🔍 Trying day variations for classroom:', possibleDayNames);
    
    let dayHours = null;
    for (const dayName of possibleDayNames) {
      if (availableHours[dayName]) {
        dayHours = availableHours[dayName];
        console.log('✅ Found classroom hours with:', dayName, dayHours);
        break;
      }
    }

    if (!dayHours || dayHours.length === 0) {
      // Convert English day names to Turkish for display
      const availableDays = Object.keys(availableHours)
        .filter(k => availableHours[k] && availableHours[k].length > 0)
        .map(d => ENGLISH_TO_DAY[d.toLowerCase()] || d)
        .join(', ');
      console.log('❌ No hours found, available days:', availableDays);
      errors.push(`${classroom.name} ${day} günü kullanılamıyor (Müsait günler: ${availableDays})`);
      return { valid: false, errors };
    }

    // Check if time slot is within available hours
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    const isWithinAvailableHours = dayHours.some((timeRange: string) => {
      const [aStart, aEnd] = timeRange.split('-');
      const aStartMin = timeToMinutes(aStart);
      const aEndMin = timeToMinutes(aEnd);

      return startMin >= aStartMin && endMin <= aEndMin;
    });

    if (!isWithinAvailableHours) {
      errors.push(
        `${classroom.name} bu saatte (${startTime}-${endTime}) kullanılamıyor. Müsait saatler: ${dayHours.join(', ')}`
      );
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

/**
 * Helper: Convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
