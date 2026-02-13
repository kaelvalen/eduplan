'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { DraggableScheduleCard } from './draggable-schedule-card';
import type { Schedule } from '@/types';

interface DroppableTimeSlotProps {
  /** Unique id for dnd-kit (must be unique across all droppables on the page) */
  id: string;
  day: string;
  slot: string;
  schedule: Schedule | null;
  isLunch: boolean;
  rowSpan: number;
  onScheduleClick: (schedule: Schedule) => void;
  isAdmin: boolean;
}

export function DroppableTimeSlot({
  id: droppableId,
  day,
  slot,
  schedule,
  isLunch,
  rowSpan,
  onScheduleClick,
  isAdmin,
}: DroppableTimeSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      day,
      slot,
      type: 'timeslot',
    },
    disabled: !isAdmin || !!schedule, // Disable if not admin or slot is occupied
  });

  const slotHeightPx = 48; // Her satır yüksekliği (padding + içerik)
  const cellMinHeight = schedule ? rowSpan * slotHeightPx : undefined;

  return (
    <td
      ref={setNodeRef}
      rowSpan={schedule ? rowSpan : 1}
      style={cellMinHeight != null ? { minHeight: cellMinHeight } : undefined}
      className={cn(
        'p-1 border-r last:border-r-0 align-top transition-colors',
        schedule && 'bg-primary/5',
        isLunch && !schedule && 'bg-amber-50/30 dark:bg-amber-950/10',
        isOver && !schedule && 'bg-primary/20 ring-2 ring-primary ring-inset'
      )}
    >
      {schedule ? (
        <DraggableScheduleCard
          schedule={schedule}
          rowSpan={rowSpan}
          onClick={() => onScheduleClick(schedule)}
          isAdmin={isAdmin}
        />
      ) : isLunch ? (
        <div className="h-8 flex items-center justify-center text-xs text-amber-600/40 font-medium">
          ARA
        </div>
      ) : (
        <div className={cn('h-8', isOver && 'flex items-center justify-center')}>
          {isOver && (
            <span className="text-xs text-primary font-medium animate-pulse">Buraya Bırak</span>
          )}
        </div>
      )}
    </td>
  );
}
