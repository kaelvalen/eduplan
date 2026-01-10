'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { DAYS_TR as DAYS, TIME_SLOTS } from '@/constants/time';

interface AvailabilityPickerProps {
    value: Record<string, string[]>;
    onChange: (value: Record<string, string[]>) => void;
    disabled?: boolean;
}

export function AvailabilityPicker({ value, onChange, disabled = false }: AvailabilityPickerProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [dragMode, setDragMode] = useState<'add' | 'remove'>('add');

    const isSlotSelected = (day: string, time: string) => {
        return value[day]?.includes(time) ?? false;
    };

    const toggleSlot = (day: string, time: string) => {
        if (disabled) return;

        const daySlots = value[day] || [];
        const isSelected = daySlots.includes(time);

        const newDaySlots = isSelected
            ? daySlots.filter((t) => t !== time)
            : [...daySlots, time].sort();

        onChange({
            ...value,
            [day]: newDaySlots,
        });
    };

    const handleMouseDown = (day: string, time: string) => {
        if (disabled) return;
        setIsDragging(true);
        setDragMode(isSlotSelected(day, time) ? 'remove' : 'add');
        toggleSlot(day, time);
    };

    const handleMouseEnter = (day: string, time: string) => {
        if (!isDragging || disabled) return;

        const isSelected = isSlotSelected(day, time);
        if ((dragMode === 'add' && !isSelected) || (dragMode === 'remove' && isSelected)) {
            toggleSlot(day, time);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const selectAllDay = (day: string) => {
        if (disabled) return;
        const allSelected = TIME_SLOTS.every((time) => isSlotSelected(day, time));

        onChange({
            ...value,
            [day]: allSelected ? [] : [...TIME_SLOTS],
        });
    };

    const selectAllTime = (time: string) => {
        if (disabled) return;
        const allSelected = DAYS.every((day) => isSlotSelected(day, time));

        const newValue = { ...value };
        DAYS.forEach((day) => {
            const daySlots = newValue[day] || [];
            if (allSelected) {
                newValue[day] = daySlots.filter((t) => t !== time);
            } else if (!daySlots.includes(time)) {
                newValue[day] = [...daySlots, time].sort();
            }
        });

        onChange(newValue);
    };

    const selectAll = () => {
        if (disabled) return;
        const allSelected = DAYS.every((day) =>
            TIME_SLOTS.every((time) => isSlotSelected(day, time))
        );

        if (allSelected) {
            onChange({});
        } else {
            const newValue: Record<string, string[]> = {};
            DAYS.forEach((day) => {
                newValue[day] = [...TIME_SLOTS];
            });
            onChange(newValue);
        }
    };

    const totalSelected = DAYS.reduce((acc, day) => acc + (value[day]?.length || 0), 0);
    const totalSlots = DAYS.length * TIME_SLOTS.length;

    return (
        <div
            className="select-none"
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                    {totalSelected} / {totalSlots} saat seçili
                </span>
                <button
                    type="button"
                    onClick={selectAll}
                    disabled={disabled}
                    className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                    {totalSelected === totalSlots ? 'Tümünü Kaldır' : 'Tümünü Seç'}
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50">
                            <th className="p-2 text-left font-medium border-r w-16">Saat</th>
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
                        {TIME_SLOTS.map((time) => (
                            <tr key={time} className="border-t">
                                <td
                                    className="p-2 font-medium bg-muted/30 border-r cursor-pointer hover:bg-muted/50"
                                    onClick={() => selectAllTime(time)}
                                >
                                    {time}
                                </td>
                                {DAYS.map((day) => {
                                    const isSelected = isSlotSelected(day, time);
                                    return (
                                        <td
                                            key={`${day}-${time}`}
                                            className={cn(
                                                'p-2 text-center border-r last:border-r-0 cursor-pointer transition-colors',
                                                isSelected
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'hover:bg-muted/50',
                                                disabled && 'cursor-not-allowed opacity-50'
                                            )}
                                            onMouseDown={() => handleMouseDown(day, time)}
                                            onMouseEnter={() => handleMouseEnter(day, time)}
                                        >
                                            {isSelected && '✓'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
                💡 Sürükleyerek birden fazla saat seçebilirsiniz. Gün veya saat başlıklarına tıklayarak tüm satır/sütunu seçebilirsiniz.
            </p>
        </div>
    );
}
