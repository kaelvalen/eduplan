/**
 * Time Utilities for Scheduler
 * Handles time block generation and time-related operations
 */

import type { TimeBlock, TimeSettings } from './types';

/**
 * Convert time string to minutes
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Convert minutes to time string
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Generate dynamic time blocks based on settings
 * Handles variable slot durations and lunch breaks
 */
export function generateDynamicTimeBlocks(settings: TimeSettings): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const { slotDuration, dayStart, dayEnd, lunchBreakStart, lunchBreakEnd } = settings;
  
  const startMinutes = timeToMinutes(dayStart);
  const endMinutes = timeToMinutes(dayEnd);
  const lunchStartMin = timeToMinutes(lunchBreakStart);
  const lunchEndMin = timeToMinutes(lunchBreakEnd);
  
  for (let current = startMinutes; current < endMinutes; current += slotDuration) {
    const blockEnd = current + slotDuration;
    
    // Prevent block overflow
    if (blockEnd > endMinutes) {
      break;
    }
    
    // Skip if block overlaps with lunch break
    if (current < lunchEndMin && blockEnd > lunchStartMin) {
      continue;
    }
    
    blocks.push({
      start: minutesToTime(current),
      end: minutesToTime(blockEnd)
    });
  }
  
  return blocks;
}

/**
 * Calculate duration in hours from time range
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  return Math.ceil((endMinutes - startMinutes) / 60);
}

/**
 * Check if two time ranges overlap
 */
export function timeRangesOverlap(range1Start: string, range1End: string, range2Start: string, range2End: string): boolean {
  const start1 = timeToMinutes(range1Start);
  const end1 = timeToMinutes(range1End);
  const start2 = timeToMinutes(range2Start);
  const end2 = timeToMinutes(range2End);
  
  return start1 < end2 && start2 < end1;
}

/**
 * Check if time blocks are consecutive
 */
export function areBlocksConsecutive(blocks: TimeBlock[]): boolean {
  for (let i = 0; i < blocks.length - 1; i++) {
    if (blocks[i].end !== blocks[i + 1].start) {
      return false;
    }
  }
  return true;
}
