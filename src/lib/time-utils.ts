/**
 * Time Utility Functions for EduPlan
 * 
 * Zaman işleme yardımcı fonksiyonları
 */

import { DAY_MAPPING, WEEK_DAYS, isValidTimeSlot } from '@/constants/time';

// ==================== AVAILABLE HOURS PARSING ====================

/**
 * JSON string'den available hours objesine parse eder
 * Hem Türkçe hem İngilizce gün anahtarlarını destekler
 */
export function parseAvailableHours(jsonStr: string): Record<string, string[]> {
  try {
    const parsed = JSON.parse(jsonStr);
    if (typeof parsed !== 'object' || parsed === null) {
      return getEmptyHours();
    }
    return parsed;
  } catch {
    return getEmptyHours();
  }
}

/**
 * Available hours objesini JSON string'e çevirir
 */
export function stringifyAvailableHours(hours: Record<string, string[]>): string {
  return JSON.stringify(hours);
}

/**
 * Boş çalışma saatleri objesi döndürür (İngilizce anahtarlarla)
 */
export function getEmptyHours(): Record<string, string[]> {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
}

/**
 * Boş Türkçe çalışma saatleri objesi döndürür
 */
export function getEmptyHoursTr(): Record<string, string[]> {
  return {
    Pazartesi: [],
    Salı: [],
    Çarşamba: [],
    Perşembe: [],
    Cuma: [],
  };
}

// ==================== WORKING HOURS UTILITIES ====================

/**
 * Belirli bir gün ve saat için müsaitlik kontrolü
 * @param hours - Çalışma saatleri objesi
 * @param day - Gün (Türkçe veya İngilizce)
 * @param time - Saat (örn: '09:00')
 * @returns Müsait ise true
 */
export function isAvailableAt(
  hours: Record<string, string[]>,
  day: string,
  time: string
): boolean {
  // Boş obje = her zaman müsait
  if (Object.keys(hours).length === 0) return true;

  // Direkt erişim dene
  let slots = hours[day];

  // Bulunamadıysa mapped key dene
  if (!slots) {
    const mappedDay = DAY_MAPPING[day];
    if (mappedDay) {
      slots = hours[mappedDay];
    }
  }

  // Gün tanımsız veya boş = müsait değil
  if (!slots || slots.length === 0) return false;

  return slots.includes(time);
}

/**
 * Çalışma saatlerini Türkçe'den İngilizce'ye dönüştürür
 */
export function convertHoursToEn(hours: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  for (const [day, slots] of Object.entries(hours)) {
    const enDay = DAY_MAPPING[day] || day.toLowerCase();
    if (WEEK_DAYS.includes(enDay as typeof WEEK_DAYS[number])) {
      result[enDay] = slots;
    }
  }
  
  return result;
}

/**
 * Çalışma saatlerini İngilizce'den Türkçe'ye dönüştürür
 */
export function convertHoursToTr(hours: Record<string, string[]>): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  
  for (const [day, slots] of Object.entries(hours)) {
    const trDay = DAY_MAPPING[day] || day;
    result[trDay] = slots;
  }
  
  return result;
}

// ==================== TIME RANGE UTILITIES ====================

/**
 * Zaman aralığı string'ini parse eder
 * @param range - Format: "09:00-10:00"
 */
export function parseTimeRange(range: string): { start: string; end: string } | null {
  const parts = range.split('-');
  if (parts.length !== 2) return null;
  
  const [start, end] = parts;
  if (!isValidTimeSlot(start) || !isValidTimeSlot(end)) return null;
  
  return { start, end };
}

/**
 * Zaman aralığı oluşturur
 */
export function formatTimeRange(start: string, end: string): string {
  return `${start}-${end}`;
}

/**
 * Bir zaman aralığından sadece başlangıç saatini alır
 */
export function getStartTime(range: string): string {
  return range.split('-')[0] || '';
}

/**
 * Bir zaman aralığından sadece bitiş saatini alır
 */
export function getEndTime(range: string): string {
  return range.split('-')[1] || '';
}

// ==================== LEGACY SUPPORT ====================

/** 
 * parseWorkingHours için alias (geriye uyumluluk)
 * @deprecated parseAvailableHours kullanın
 */
export const parseWorkingHours = parseAvailableHours;

/**
 * stringifyWorkingHours için alias (geriye uyumluluk)
 * @deprecated stringifyAvailableHours kullanın
 */
export const stringifyWorkingHours = stringifyAvailableHours;
