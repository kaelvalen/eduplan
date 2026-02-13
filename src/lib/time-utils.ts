/**
 * Time Utility Functions for EduPlan
 *
 * Schedule ile uyumlu: tüm uygunluk saatleri "09:00-10:00" aralık formatındadır.
 * Gün anahtarları Türkçe: Pazartesi, Salı, Çarşamba, Perşembe, Cuma.
 */

import { DAY_MAPPING, DAYS_TR, TIME_CONFIG, isValidTimeSlot } from '@/constants/time';

const SLOT_DURATION_MIN = TIME_CONFIG.slotDuration;

export type HoursMap = Record<string, string[]>;

/** Boş uygunluk saati (Türkçe günler, aralık formatı) */
function getEmptyHoursTr(): HoursMap {
  const o: HoursMap = {};
  for (const d of DAYS_TR) o[d] = [];
  return o;
}

/**
 * JSON string'i uygunluk saatlerine parse eder.
 * Türkçe gün anahtarları kullanılır. Değerler "09:00-10:00" aralık formatındadır.
 * Eski slot formatı ("09:00") okunursa aralığa çevrilir (geriye uyumluluk).
 */
export function parseAvailableHours(jsonStr: string): HoursMap {
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, string[]>;
    if (typeof parsed !== 'object' || parsed === null) return getEmptyHoursTr();

    const result = getEmptyHoursTr();
    for (const day of DAYS_TR) {
      const raw = parsed[day] ?? parsed[DAY_MAPPING[day]] ?? [];
      if (!Array.isArray(raw)) continue;
      result[day] = raw.map((s) => {
        const t = String(s).trim();
        if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) return t;
        if (/^\d{2}:\d{2}$/.test(t)) return slotToRange(t);
        return '';
      }).filter(Boolean);
    }
    return result;
  } catch {
    return getEmptyHoursTr();
  }
}

/** Tek slot "09:00" -> "09:00-10:00" (slotDuration 60 dk) */
function slotToRange(slot: string): string {
  const [h, m] = slot.split(':').map(Number);
  const startMin = h * 60 + m;
  const endMin = startMin + SLOT_DURATION_MIN;
  const eh = Math.floor(endMin / 60);
  const em = endMin % 60;
  return `${slot}-${eh.toString().padStart(2, '0')}:${em.toString().padStart(2, '0')}`;
}

/**
 * Saat listesini aralık formatına çevirir (uyarı mesajları için).
 * "08:00" -> "08:00-09:00", "08:00-09:00" -> aynen.
 */
export function normalizeToRanges(arr: string[]): string[] {
  return arr
    .map((s) => {
      const t = String(s).trim();
      if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(t)) return t;
      if (/^\d{2}:\d{2}$/.test(t)) return slotToRange(t);
      return '';
    })
    .filter(Boolean);
}

export function stringifyAvailableHours(hours: HoursMap): string {
  return JSON.stringify(hours);
}

/** Boş çalışma saatleri (Türkçe günler) */
export function getEmptyHours(): HoursMap {
  return getEmptyHoursTr();
}

/**
 * Verilen gün ve slot başlangıcı için müsaitlik.
 * `time` = slot başlangıcı (örn. "09:00"); 1 saatlik blok kabul edilir.
 * Aralık formatında herhangi bir blok bu slotu kapsıyorsa true.
 */
export function isAvailableAt(
  hours: HoursMap,
  day: string,
  time: string
): boolean {
  if (!hours || Object.keys(hours).length === 0) return true;

  const key = (DAYS_TR as readonly string[]).includes(day) ? day : (DAY_MAPPING[day] ?? day);
  const ranges = hours[key] ?? hours[day];
  if (!ranges || ranges.length === 0) return false;

  const slotStartMin = timeToMinutes(time);
  const slotEndMin = slotStartMin + SLOT_DURATION_MIN;

  return ranges.some((r) => {
    const [start, end] = r.split('-').map((s) => s.trim());
    const rStart = timeToMinutes(start);
    const rEnd = timeToMinutes(end);
    return rStart <= slotStartMin && rEnd >= slotEndMin;
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Çalışma saatlerini Türkçe'den İngilizce gün anahtarlarına çevirir (ihtiyaç halinde).
 */
export function convertHoursToEn(hours: HoursMap): HoursMap {
  const result: HoursMap = {};
  for (const [day, arr] of Object.entries(hours)) {
    const en = DAY_MAPPING[day] ?? day.toLowerCase();
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(en)) {
      result[en] = arr;
    }
  }
  return result;
}

/**
 * Çalışma saatlerini Türkçe gün anahtarlarına çevirir.
 */
export function convertHoursToTr(hours: HoursMap): HoursMap {
  const result: HoursMap = {};
  for (const [day, arr] of Object.entries(hours)) {
    const trKey = (DAYS_TR as readonly string[]).includes(day) ? day : (DAY_MAPPING[day] ?? day);
    if ((DAYS_TR as readonly string[]).includes(trKey)) result[trKey] = arr;
  }
  return result;
}

// ==================== TIME RANGE UTILITIES ====================

export function parseTimeRange(range: string): { start: string; end: string } | null {
  const parts = range.split('-');
  if (parts.length !== 2) return null;
  const [start, end] = parts.map((s) => s.trim());
  if (!isValidTimeSlot(start) || !isValidTimeSlot(end)) return null;
  return { start, end };
}

export function formatTimeRange(start: string, end: string): string {
  return `${start}-${end}`;
}

export function getStartTime(range: string): string {
  return range.split('-')[0]?.trim() ?? '';
}

export function getEndTime(range: string): string {
  return range.split('-')[1]?.trim() ?? '';
}

export const parseWorkingHours = parseAvailableHours;
export const stringifyWorkingHours = stringifyAvailableHours;

/**
 * Backend-safe parse of teacher working hours JSON.
 * Never throws: returns {} for empty, invalid or missing string.
 */
export function parseTeacherWorkingHoursSafe(raw: string | null | undefined): HoursMap {
  if (raw == null || String(raw).trim() === '') return getEmptyHoursTr();
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed !== 'object' || parsed === null) return getEmptyHoursTr();
    const result: HoursMap = {};
    for (const day of DAYS_TR) {
      const val = parsed[day] ?? parsed[DAY_MAPPING[day]];
      result[day] = Array.isArray(val) ? val.filter((s): s is string => typeof s === 'string') : [];
    }
    return result;
  } catch {
    return getEmptyHoursTr();
  }
}
