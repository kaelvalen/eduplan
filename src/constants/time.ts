/**
 * Centralized Time Configuration for EduPlan
 * 
 * Tüm zaman sabitleri ve yapılandırmaları bu dosyada tanımlıdır.
 * Diğer dosyalar bu modülden import etmelidir.
 */

// ==================== TIME CONFIGURATION ====================
export const TIME_CONFIG = {
  /** Slot süresi (dakika) */
  slotDuration: 60,
  /** Gün başlangıcı */
  dayStart: '08:00',
  /** Gün bitişi */
  dayEnd: '18:00',
  /** Öğle arası */
  lunchBreak: { start: '12:00', end: '13:00' },
} as const;

// ==================== DAYS ====================
export const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] as const;
export const DAYS_EN = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

/** Türkçe günler (eski API uyumluluğu için) */
export const DAYS = DAYS_TR;

/** Gün mapping - Türkçe <-> İngilizce */
export const DAY_MAPPING: Record<string, string> = {
  // TR -> EN
  'Pazartesi': 'monday',
  'Salı': 'tuesday',
  'Çarşamba': 'wednesday',
  'Perşembe': 'thursday',
  'Cuma': 'friday',
  // EN -> TR
  'monday': 'Pazartesi',
  'tuesday': 'Salı',
  'wednesday': 'Çarşamba',
  'thursday': 'Perşembe',
  'friday': 'Cuma',
};

/** İngilizce -> Türkçe map */
export const DAYS_EN_TO_TR: Record<string, string> = {
  'monday': 'Pazartesi',
  'tuesday': 'Salı',
  'wednesday': 'Çarşamba',
  'thursday': 'Perşembe',
  'friday': 'Cuma',
  'saturday': 'Cumartesi',
  'sunday': 'Pazar',
};

/** Türkçe -> İngilizce map */
export const DAYS_TR_TO_EN: Record<string, string> = {
  'Pazartesi': 'monday',
  'Salı': 'tuesday',
  'Çarşamba': 'wednesday',
  'Perşembe': 'thursday',
  'Cuma': 'friday',
  'Cumartesi': 'saturday',
  'Pazar': 'sunday',
};

/** İngilizce hafta günleri */
export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const;

// ==================== TIME SLOTS ====================

/**
 * Zaman slotlarını dinamik olarak üretir
 * @param config - Zaman yapılandırması
 * @returns Saat dilimleri dizisi (örn: ['08:00', '09:00', ...])
 */
export function generateTimeSlots(config = TIME_CONFIG): string[] {
  const slots: string[] = [];
  const [startHour] = config.dayStart.split(':').map(Number);
  const [endHour] = config.dayEnd.split(':').map(Number);
  const [lunchStart] = config.lunchBreak.start.split(':').map(Number);
  const [lunchEnd] = config.lunchBreak.end.split(':').map(Number);
  const stepHours = config.slotDuration / 60;

  for (let h = startHour; h < endHour; h += stepHours) {
    // Öğle arasını atla
    if (h >= lunchStart && h < lunchEnd) continue;
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }

  return slots;
}

/**
 * Zaman bloklarını dinamik olarak üretir (başlangıç-bitiş çiftleri)
 * @param config - Zaman yapılandırması
 * @returns Zaman blokları dizisi
 */
export function generateTimeBlocks(config = TIME_CONFIG): { start: string; end: string }[] {
  const blocks: { start: string; end: string }[] = [];
  const [startHour] = config.dayStart.split(':').map(Number);
  const [endHour] = config.dayEnd.split(':').map(Number);
  const [lunchStart] = config.lunchBreak.start.split(':').map(Number);
  const [lunchEnd] = config.lunchBreak.end.split(':').map(Number);
  const stepHours = config.slotDuration / 60;

  for (let h = startHour; h < endHour; h += stepHours) {
    // Öğle arasını atla
    if (h >= lunchStart && h < lunchEnd) continue;
    
    const start = `${h.toString().padStart(2, '0')}:00`;
    const end = `${(h + stepHours).toString().padStart(2, '0')}:00`;
    blocks.push({ start, end });
  }

  return blocks;
}

/** Pre-generated time slots (varsayılan yapılandırma ile) */
export const TIME_SLOTS = generateTimeSlots();

/** Pre-generated time blocks (varsayılan yapılandırma ile) */
export const TIME_BLOCKS = generateTimeBlocks();

// ==================== TYPES ====================
export type Day = typeof DAYS_TR[number];
export type DayEn = typeof DAYS_EN[number];
export type TimeSlot = string;
export type TimeBlock = { start: string; end: string };

// ==================== UTILITY FUNCTIONS ====================

/**
 * Türkçe günü İngilizce'ye çevirir
 */
export function dayTrToEn(day: string): string {
  return DAYS_TR_TO_EN[day] || day.toLowerCase();
}

/**
 * İngilizce günü Türkçe'ye çevirir
 */
export function dayEnToTr(day: string): string {
  return DAYS_EN_TO_TR[day.toLowerCase()] || day;
}

/**
 * Verilen günün geçerli bir çalışma günü olup olmadığını kontrol eder
 */
export function isValidWorkDay(day: string): boolean {
  const normalizedDay = day.toLowerCase();
  return DAYS_EN.includes(normalizedDay as DayEn) || 
         DAYS_TR.includes(day as Day);
}

/**
 * Normalize day name to Turkish standard
 * Handles both Turkish and English inputs, case-insensitive
 *
 * @param day - Day name in Turkish or English
 * @returns Normalized Turkish day name
 *
 * @example
 * normalizeDayName("monday") => "Pazartesi"
 * normalizeDayName("PAZARTESI") => "Pazartesi"
 * normalizeDayName("Salı") => "Salı"
 */
export function normalizeDayName(day: string): string {
  if (!day) return '';

  const trimmed = day.trim();

  // If already proper Turkish, return as-is
  if (DAYS_TR.includes(trimmed as Day)) {
    return trimmed;
  }

  // Try English -> Turkish conversion
  const lowerDay = trimmed.toLowerCase();
  const turkish = DAYS_EN_TO_TR[lowerDay];
  if (turkish) {
    return turkish;
  }

  // Try case-insensitive match against Turkish days
  for (const turkishDay of DAYS_TR) {
    if (turkishDay.toLowerCase() === lowerDay) {
      return turkishDay;
    }
  }

  // Fallback: return original with warning
  console.warn(`Unknown day name: "${day}", using as-is`);
  return trimmed;
}

/**
 * Verilen saatin geçerli bir zaman dilimi olup olmadığını kontrol eder
 */
export function isValidTimeSlot(time: string): boolean {
  const pattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return pattern.test(time);
}

/**
 * Saat string'ini dakika cinsine çevirir (karşılaştırma için)
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * İki zaman diliminin çakışıp çakışmadığını kontrol eder
 */
export function doTimesOverlap(
  start1: string, end1: string,
  start2: string, end2: string
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  
  return s1 < e2 && s2 < e1;
}
