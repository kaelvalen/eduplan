'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { getFacultyName, getDepartmentName } from '@/constants/faculties';
import { DAYS_TR as DAYS, DAYS_TR_TO_EN } from '@/constants/time';
import { useScheduleTableSlots } from '@/hooks/use-schedule-table-slots';
import { parseAvailableHours, isAvailableAt } from '@/lib/time-utils';
import { ScheduleCellContent } from '@/components/programs/schedule-cell-content';
import { cn } from '@/lib/utils';
import type { Classroom, Schedule } from '@/types';

interface ClassroomDetailModalProps {
    classroom: Classroom | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClassroomDetailModal({ classroom, open, onOpenChange }: ClassroomDetailModalProps) {
    const [schedule, setSchedule] = useState<Schedule[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { token } = useAuth();
    const { dynamicTimeSlots, isLunchSlot, toMinutes, slotDuration } = useScheduleTableSlots();

    useEffect(() => {
        if (classroom && open) {
            fetchSchedule();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [classroom, open]);

    const fetchSchedule = async () => {
        if (!classroom) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/classrooms/${classroom.id}/schedule`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSchedule(data.schedule || []);
            }
        } catch (error) {
            console.error('Error fetching classroom schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getScheduleForSlot = (dayTr: string, slot: string) => {
        const [slotStart] = slot.split('-').map((t) => t.trim());
        const targetEn = DAYS_TR_TO_EN[dayTr as keyof typeof DAYS_TR_TO_EN];
        return schedule.find((s) => {
            const sDay = (s.day || '').toLowerCase();
            const dayMatch = sDay === dayTr.toLowerCase() || (targetEn && sDay === targetEn.toLowerCase());
            if (!dayMatch) return false;
            const [sStart] = (s.time_range || '').split('-').map((t) => t.trim());
            return sStart === slotStart;
        }) || null;
    };

    const isOccupied = (dayTr: string, slot: string) => {
        const [slotStart, slotEnd] = slot.split('-').map((t) => t.trim());
        const targetEn = DAYS_TR_TO_EN[dayTr as keyof typeof DAYS_TR_TO_EN];
        return schedule.some((s) => {
            const sDay = (s.day || '').toLowerCase();
            const dayMatch = sDay === dayTr.toLowerCase() || (targetEn && sDay === targetEn.toLowerCase());
            if (!dayMatch) return false;
            const [sStart, sEnd] = (s.time_range || '').split('-').map((t) => t.trim());
            const sMin = toMinutes(sStart);
            const eMin = toMinutes(sEnd);
            const slSMin = toMinutes(slotStart);
            const slEMin = toMinutes(slotEnd || slotStart);
            return slSMin >= sMin && slEMin <= eMin && sStart !== slotStart;
        });
    };

    const availableHours = classroom ? parseAvailableHours(classroom.available_hours || '{}') : {};
    const checkAvailability = (day: string, slot: string) => {
        const [slotStart] = slot.split('-').map((t) => t.trim());
        return isAvailableAt(availableHours, day, slotStart);
    };

    if (!classroom) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{classroom.name}</span>
                        <Badge variant={
                            classroom.type === 'teorik' ? 'default' :
                            classroom.type === 'lab' ? 'secondary' :
                            'outline'
                        }>
                            {classroom.type === 'teorik' ? 'Teorik' :
                             classroom.type === 'lab' ? 'Laboratuvar' :
                             'Hibrit'}
                        </Badge>
                        <Badge variant={classroom.is_active !== false ? 'success' : 'outline'}>
                            {classroom.is_active !== false ? 'Aktif' : 'Pasif'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Kapasite: <strong>{classroom.capacity}</strong> kişi</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {getFacultyName(classroom.faculty)} – {getDepartmentName(classroom.faculty, classroom.department)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                        {classroom.priority_dept && (
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Öncelikli Bölüm:</span>
                                        <Badge variant="outline">{classroom.priority_dept}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Haftalık Program
                        </h3>

                        {isLoading ? (
                            <div className="h-48 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : (
                            <div className="border rounded-lg overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/50">
                                            <th className="p-2 text-left font-medium border-r w-16">Saat</th>
                                            {DAYS.map((day) => (
                                                <th
                                                    key={day}
                                                    className="p-2 text-center font-medium border-r last:border-r-0 min-w-[140px]"
                                                >
                                                    {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dynamicTimeSlots.map((slot) => {
                                            const isLunch = isLunchSlot(slot);
                                            return (
                                                <tr
                                                    key={slot}
                                                    className={cn('border-t', isLunch && 'bg-amber-50/50 dark:bg-amber-950/20')}
                                                >
                                                    <td
                                                        className={cn(
                                                            'p-2 font-medium border-r text-xs',
                                                            isLunch ? 'bg-amber-100/50 dark:bg-amber-900/30' : 'bg-muted/30'
                                                        )}
                                                    >
                                                        {slot}
                                                        {isLunch && slot.startsWith('12:') && (
                                                            <span className="block text-[10px] text-amber-600">🍽️ Öğle</span>
                                                        )}
                                                    </td>
                                                    {DAYS.map((dayTr) => {
                                                        const slotSchedule = getScheduleForSlot(dayTr, slot);
                                                        const occupied = isOccupied(dayTr, slot);
                                                        if (occupied) return null;

                                                        let rowSpan = 1;
                                                        if (slotSchedule) {
                                                            const [sStart, sEnd] = (slotSchedule.time_range || '').split('-').map((t) => t.trim());
                                                            const duration = toMinutes(sEnd || sStart) - toMinutes(sStart);
                                                            rowSpan = Math.max(1, Math.round(duration / slotDuration));
                                                        }

                                                        const isAvailable = checkAvailability(dayTr, slot);

                                                        return (
                                                            <td
                                                                key={`${dayTr}-${slot}`}
                                                                rowSpan={slotSchedule ? rowSpan : 1}
                                                                className={cn(
                                                                    'p-1 border-r last:border-r-0 align-top',
                                                                    slotSchedule && 'bg-primary/5',
                                                                    !slotSchedule && isAvailable && 'bg-green-50 dark:bg-green-950/20',
                                                                    !slotSchedule && !isAvailable && !isLunch && 'bg-red-50 dark:bg-red-950/20',
                                                                    isLunch && !slotSchedule && 'bg-amber-50/30 dark:bg-amber-950/10'
                                                                )}
                                                            >
                                                                {slotSchedule ? (
                                                                    <ScheduleCellContent
                                                                        schedule={slotSchedule}
                                                                        showTimeRange={rowSpan > 1}
                                                                        interactive
                                                                    />
                                                                ) : isLunch ? (
                                                                    <div className="h-8 flex items-center justify-center text-xs text-amber-600/40 font-medium">
                                                                        ARA
                                                                    </div>
                                                                ) : !isAvailable ? (
                                                                    <div className="h-8 flex items-center justify-center text-xs text-red-600 dark:text-red-400">
                                                                        Kapalı
                                                                    </div>
                                                                ) : null}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-primary/20" />
                            <span>Ders</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800" />
                            <span>Uygun</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800" />
                            <span>Kapalı</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded bg-amber-100/50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800" />
                            <span>Öğle arası</span>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
