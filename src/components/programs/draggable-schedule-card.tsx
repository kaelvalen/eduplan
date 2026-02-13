'use client';

import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Schedule } from '@/types';

interface DraggableScheduleCardProps {
  schedule: Schedule;
  rowSpan: number;
  onClick: () => void;
  isAdmin: boolean;
}

export function DraggableScheduleCard({
  schedule,
  rowSpan,
  onClick,
  isAdmin,
}: DraggableScheduleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `schedule-${schedule.id}`,
    data: {
      schedule,
      type: 'schedule',
    },
    disabled: !isAdmin,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const slotHeightPx = 48; // Program tablosundaki tek satır yüksekliği (px)
  const minHeightPx = rowSpan * slotHeightPx;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, minHeight: minHeightPx, height: rowSpan > 1 ? '100%' : undefined }}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        'text-xs p-2 rounded border bg-card shadow-sm flex flex-col justify-center transition-all',
        isAdmin && 'cursor-move hover:bg-primary/10 hover:border-primary/50 hover:shadow-md',
        isDragging && 'opacity-50 scale-105 shadow-lg'
      )}
      title={isAdmin ? 'Sürükle veya düzenlemek için tıkla' : ''}
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
      {schedule.time_range && (
        <div className="mt-1 pt-1 border-t text-[9px] text-muted-foreground">
          🕒 {schedule.time_range}
        </div>
      )}
    </div>
  );
}
