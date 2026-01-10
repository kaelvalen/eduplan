import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Re-export from centralized modules for backward compatibility
export { 
  parseWorkingHours, 
  stringifyWorkingHours 
} from './time-utils';

export { 
  DAYS_EN_TO_TR as DAYS_TR, 
  DAYS_TR_TO_EN as DAYS_EN, 
  TIME_SLOTS, 
  WEEK_DAYS,
  DAY_MAPPING
} from '@/constants/time';

