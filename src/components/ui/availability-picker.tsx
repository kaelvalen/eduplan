'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DAYS_TR as DAYS, TIME_BLOCKS } from '@/constants/time';
import { formatTimeRange } from '@/lib/time-utils';

interface AvailabilityPickerProps {
  value: Record<string, string[]>;
  onChange: (value: Record<string, string[]>) => void;
  disabled?: boolean;
}

const rangeStr = (b: { start: string; end: string }) => formatTimeRange(b.start, b.end);
const ALL_RANGES = TIME_BLOCKS.map(rangeStr);

export function AvailabilityPicker({ value, onChange, disabled = false }: AvailabilityPickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

  const isBlockSelected = (day: string, range: string) => value[day]?.includes(range) ?? false;

  const toggleBlock = (day: string, range: string) => {
    if (disabled) return;
    const arr = value[day] || [];
    const sel = arr.includes(range);
    onChange({
      ...value,
      [day]: sel ? arr.filter((r) => r !== range) : [...arr, range].sort(),
    });
  };

  const handleMouseDown = (day: string, range: string) => {
    if (disabled) return;
    setIsDragging(true);
    setDragMode(isBlockSelected(day, range) ? 'remove' : 'add');
    toggleBlock(day, range);
  };

  const handleMouseEnter = (day: string, range: string) => {
    if (!isDragging || disabled) return;
    const sel = isBlockSelected(day, range);
    if ((dragMode === 'add' && !sel) || (dragMode === 'remove' && sel)) toggleBlock(day, range);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const selectAllDay = (day: string) => {
    if (disabled) return;
    const all = ALL_RANGES.every((r) => isBlockSelected(day, r));
    onChange({ ...value, [day]: all ? [] : [...ALL_RANGES] });
  };

  const selectAllBlock = (range: string) => {
    if (disabled) return;
    const all = DAYS.every((d) => isBlockSelected(d, range));
    const next = { ...value };
    DAYS.forEach((day) => {
      const arr = next[day] || [];
      if (all) {
        next[day] = arr.filter((r) => r !== range);
      } else if (!arr.includes(range)) {
        next[day] = [...arr, range].sort();
      }
    });
    onChange(next);
  };

  const selectAll = () => {
    if (disabled) return;
    const all = DAYS.every((d) => ALL_RANGES.every((r) => isBlockSelected(d, r)));
    if (all) {
      onChange({});
    } else {
      const next: Record<string, string[]> = {};
      DAYS.forEach((d) => { next[d] = [...ALL_RANGES]; });
      onChange(next);
    }
  };

  const totalSelected = DAYS.reduce((acc, d) => acc + (value[d]?.length ?? 0), 0);
  const totalBlocks = DAYS.length * ALL_RANGES.length;

  return (
    <div className="select-none" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {totalSelected} / {totalBlocks} aralık seçili
        </span>
        <button
          type="button"
          onClick={selectAll}
          disabled={disabled}
          className="text-sm text-primary hover:underline disabled:opacity-50"
        >
          {totalSelected === totalBlocks ? 'Tümünü Kaldır' : 'Tümünü Seç'}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="p-2 text-left font-medium border-r w-28">Aralık</th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="p-2 text-center font-medium border-r last:border-r-0 cursor-pointer hover:bg-muted/80"
                  onClick={() => selectAllDay(day)}
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_BLOCKS.map((block) => {
              const range = rangeStr(block);
              return (
                <tr key={range} className="border-t">
                  <td
                    className="p-2 font-medium bg-muted/30 border-r cursor-pointer hover:bg-muted/50"
                    onClick={() => selectAllBlock(range)}
                  >
                    {range}
                  </td>
                  {DAYS.map((day) => {
                    const isSelected = isBlockSelected(day, range);
                    return (
                      <td
                        key={`${day}-${range}`}
                        className={cn(
                          'p-2 text-center border-r last:border-r-0 cursor-pointer transition-colors',
                          isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50',
                          disabled && 'cursor-not-allowed opacity-50'
                        )}
                        onMouseDown={() => handleMouseDown(day, range)}
                        onMouseEnter={() => handleMouseEnter(day, range)}
                      >
                        {isSelected && '✓'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        💡 Sürükleyerek birden fazla aralık seçebilirsiniz. Gün veya aralık başlıklarına tıklayarak tüm satır/sütunu seçebilirsiniz.
      </p>
    </div>
  );
}
