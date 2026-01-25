'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SystemSettings } from '@/types';

export function useScheduleTableSlots() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    fetch('/api/settings', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setSettings(data))
      .catch(console.error);
  }, []);

  const dynamicTimeSlots = useMemo(() => {
    const toMinutes = (time: string) => {
      const [h, m] = (time || '00:00').split(':').map(Number);
      return h * 60 + m;
    };
    const fromMinutes = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const startMin = toMinutes(settings?.day_start || '08:00');
    const endMin = toMinutes(settings?.day_end || '18:00');
    const slotDuration = settings?.slot_duration ?? 60;

    const slots: string[] = [];
    for (let current = startMin; current < endMin; current += slotDuration) {
      const blockEnd = Math.min(current + slotDuration, endMin);
      slots.push(`${fromMinutes(current)}-${fromMinutes(blockEnd)}`);
    }
    return slots;
  }, [settings]);

  const isLunchSlot = useMemo(() => {
    const lSMin = (() => {
      const [h, m] = (settings?.lunch_break_start || '12:00').split(':').map(Number);
      return h * 60 + m;
    })();
    const lEMin = (() => {
      const [h, m] = (settings?.lunch_break_end || '13:00').split(':').map(Number);
      return h * 60 + m;
    })();
    const toMinutes = (time: string) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    return (slot: string) => {
      const [start, end] = slot.split('-');
      const sMin = toMinutes(start || '00:00');
      const eMin = toMinutes(end || start || '00:00');
      return sMin < lEMin && eMin > lSMin;
    };
  }, [settings]);

  const toMinutes = useMemo(
    () => (time: string) => {
      const [h, m] = (time || '00:00').trim().split(':').map(Number);
      return h * 60 + m;
    },
    []
  );

  const slotDuration = settings?.slot_duration ?? 60;

  return {
    dynamicTimeSlots,
    isLunchSlot,
    settings,
    toMinutes,
    slotDuration,
  };
}
