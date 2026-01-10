'use client';

import { useState, useEffect } from 'react';
import { Calendar, Users, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { getFacultyName, getDepartmentName } from '@/constants/faculties';
import { DAYS_TR as DAYS, TIME_SLOTS } from '@/constants/time';
import { parseAvailableHours } from '@/lib/time-utils';
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

    useEffect(() => {
        if (classroom && open) {
            fetchSchedule();
        }
    }, [classroom, open]);

    const fetchSchedule = async () => {
        if (!classroom) return;

        setIsLoading(true);
        setIsLoading(true);
        try {
            const response = await fetch(`/api/classrooms/${classroom.id}/schedule`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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

    const getScheduleForSlot = (day: string, time: string) => {
        return schedule.find((s) => {
            const startTime = s.time_range?.split('-')[0];
            return s.day === day && startTime === time;
        });
    };

    const availableHours = classroom ? parseAvailableHours(classroom.available_hours || '{}') : {};

    if (!classroom) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span>{classroom.name}</span>
                        <Badge variant={classroom.type === 'teorik' ? 'default' : 'secondary'}>
                            {classroom.type === 'teorik' ? 'Teorik' : 'Laboratuvar'}
                        </Badge>
                        <Badge variant={classroom.is_active !== false ? 'success' : 'outline'}>
                            {classroom.is_active !== false ? 'Aktif' : 'Pasif'}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Info Cards */}
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
                                        {getFacultyName(classroom.faculty)} - {getDepartmentName(classroom.faculty, classroom.department)}
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

                    {/* Weekly Schedule */}
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
                                            <th className="p-2 text-left font-medium border-r">Saat</th>
                                            {DAYS.map((day) => (
                                                <th key={day} className="p-2 text-center font-medium border-r last:border-r-0 min-w-[120px]">
                                                    {day}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {TIME_SLOTS.map((time) => (
                                            <tr key={time} className="border-t">
                                                <td className="p-2 font-medium bg-muted/30 border-r">
                                                    {time}
                                                </td>
                                                {DAYS.map((day) => {
                                                    const slotSchedule = getScheduleForSlot(day, time);
                                                    const isAvailable = !availableHours[day] || availableHours[day]?.length === 0 || availableHours[day]?.includes(time);

                                                    return (
                                                        <td
                                                            key={`${day}-${time}`}
                                                            className={`p-1 border-r last:border-r-0 ${slotSchedule
                                                                ? 'bg-primary/10'
                                                                : isAvailable
                                                                    ? 'bg-green-50 dark:bg-green-950/20'
                                                                    : 'bg-red-50 dark:bg-red-950/20'
                                                                }`}
                                                        >
                                                            {slotSchedule ? (
                                                                <div className="text-xs p-1 rounded bg-primary/20">
                                                                    <div className="font-medium truncate flex items-center justify-between gap-1">
                                                                        <span>{slotSchedule.course?.code}</span>
                                                                        <Badge variant="outline" className="h-4 px-1 text-[10px] bg-background/50">
                                                                            {(slotSchedule as any).student_count || 0}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-muted-foreground truncate">
                                                                        {slotSchedule.course?.teacher?.name}
                                                                    </div>
                                                                </div>
                                                            ) : !isAvailable ? (
                                                                <div className="text-xs text-center text-red-600 dark:text-red-400">
                                                                    Kapalı
                                                                </div>
                                                            ) : null}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 text-sm">
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
