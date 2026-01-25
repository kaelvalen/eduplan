'use client';

import { Badge } from '@/components/ui/badge';
import type { Schedule } from '@/types';

interface ScheduleCellContentProps {
  schedule: Schedule;
  /** Multi-hour derslerde süreyi göstermek için */
  showTimeRange?: boolean;
  /** Modal görünümünde tıklanabilir olmasın */
  interactive?: boolean;
}

/**
 * Programlar sayfasındaki kart ile aynı görünüm.
 * Öğretmen / derslik detay modallarında kullanılır.
 */
export function ScheduleCellContent({
  schedule,
  showTimeRange = false,
  interactive = false,
}: ScheduleCellContentProps) {
  return (
    <div
      className={`text-xs p-2 rounded border bg-card shadow-sm h-full flex flex-col justify-center transition-all ${
        interactive ? 'cursor-default hover:bg-muted/50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="font-bold text-sm text-primary truncate">{schedule.course?.code}</div>
        {schedule.session_type && (
          <Badge
            variant={schedule.session_type === 'lab' ? 'destructive' : 'secondary'}
            className="h-4 px-1 text-[10px] py-0"
          >
            {schedule.session_type === 'lab' ? 'LAB' : 'TEO'}
          </Badge>
        )}
      </div>
      <div className="font-medium mb-1 line-clamp-2">{schedule.course?.name}</div>
      <div className="text-muted-foreground truncate text-[10px]">
        👤 {schedule.course?.teacher?.name}
      </div>
      <div className="text-muted-foreground truncate text-[10px]">
        📍 {schedule.classroom?.name}
      </div>
      {showTimeRange && schedule.time_range && (
        <div className="mt-1 pt-1 border-t text-[9px] text-muted-foreground">
          🕒 {schedule.time_range}
        </div>
      )}
    </div>
  );
}
