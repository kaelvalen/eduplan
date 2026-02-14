'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value?: string;
  onChange?: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  step?: number; // in minutes
  className?: string;
  disabled?: boolean;
}

export function TimePicker({
  value,
  onChange,
  minTime = '08:00',
  maxTime = '18:00',
  step = 30,
  className,
  disabled = false,
}: TimePickerProps) {
  const [selectedHour, setSelectedHour] = useState<string>('');
  const [selectedMinute, setSelectedMinute] = useState<string>('');

  // Parse initial value
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':');
      setSelectedHour(hour);
      setSelectedMinute(minute);
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Generate hours
  const hours = [];
  const [minHour] = minTime.split(':').map(Number);
  const [maxHour] = maxTime.split(':').map(Number);
  for (let h = minHour; h <= maxHour; h++) {
    hours.push(h.toString().padStart(2, '0'));
  }

  // Generate minutes based on step
  const minutes = [];
  for (let m = 0; m < 60; m += step) {
    minutes.push(m.toString().padStart(2, '0'));
  }

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    if (selectedMinute) {
      onChange?.(`${hour}:${selectedMinute}`);
    }
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    if (selectedHour) {
      onChange?.(`${selectedHour}:${minute}`);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedHour} onValueChange={handleHourChange} disabled={disabled}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Saat" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={selectedMinute} onValueChange={handleMinuteChange} disabled={disabled}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Dk" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((minute) => (
            <SelectItem key={minute} value={minute}>
              {minute}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TimeRangePickerProps {
  startTime?: string;
  endTime?: string;
  onStartTimeChange?: (time: string) => void;
  onEndTimeChange?: (time: string) => void;
  minTime?: string;
  maxTime?: string;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function TimeRangePicker({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  minTime = '08:00',
  maxTime = '18:00',
  step = 30,
  className,
  disabled = false,
}: TimeRangePickerProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Başlangıç:</span>
        <TimePicker
          value={startTime}
          onChange={onStartTimeChange}
          minTime={minTime}
          maxTime={maxTime}
          step={step}
          disabled={disabled}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Bitiş:</span>
        <TimePicker
          value={endTime}
          onChange={onEndTimeChange}
          minTime={startTime || minTime}
          maxTime={maxTime}
          step={step}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
