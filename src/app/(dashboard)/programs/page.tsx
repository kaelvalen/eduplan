'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Building2, Users, ChevronDown, Search } from 'lucide-react';
import { useSchedules } from '@/hooks/use-schedules';
import { useCourses } from '@/hooks/use-courses';
import { getDepartmentName, FACULTIES, DEPARTMENTS } from '@/constants/faculties';
import { DAYS_TR as DAYS, TIME_SLOTS } from '@/constants/time';
import { styles } from '@/lib/design-tokens';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { Schedule, Course, SystemSettings } from '@/types';

const LEVELS = ['1', '2', '3', '4'] as const;

export default function ProgramViewPage() {
    const { schedules, isLoading: schedulesLoading } = useSchedules();
    const { courses, isLoading: coursesLoading } = useCourses();
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    const [selectedFaculty, setSelectedFaculty] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['1', '2', '3', '4']));

    // Fetch time settings for lunch break detection and dynamic slots
    useEffect(() => {
        fetch('/api/settings', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => data && setSettings(data))
            .catch(console.error);
    }, []);

    // Generate dynamic time slots based on settings
    const dynamicTimeSlots = useMemo(() => {
        if (!settings) return TIME_SLOTS; // Fallback to static
        
        const slots: string[] = [];
        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        
        const startMin = toMinutes(settings.day_start || '08:00');
        const endMin = toMinutes(settings.day_end || '18:00');
        const lunchStartMin = toMinutes(settings.lunch_break_start || '12:00');
        const lunchEndMin = toMinutes(settings.lunch_break_end || '13:00');
        const slotDuration = settings.slot_duration || 60;
        
        for (let current = startMin; current < endMin; current += slotDuration) {
            const blockEnd = current + slotDuration;
            // Skip if overlaps with lunch
            if (current < lunchEndMin && blockEnd > lunchStartMin) {
                continue;
            }
            const h = Math.floor(current / 60);
            const m = current % 60;
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
        
        return slots;
    }, [settings]);

    // Dynamic lunch break detection based on settings
    const isLunchTime = (time: string) => {
        if (!settings) return false;
        return time === settings.lunch_break_start;
    };

    // Get departments for selected faculty
    const departments = useMemo(() => {
        if (!selectedFaculty) return [];
        return DEPARTMENTS[selectedFaculty] || [];
    }, [selectedFaculty]);

    // Group schedules by department and level
    const groupedSchedules = useMemo(() => {
        if (!schedules || !courses) return {};

        // Filter by faculty/department if selected
        let filteredSchedules = [...schedules];

        if (selectedDepartment) {
            const deptCourseIds = courses
                .filter((c: Course) => c.departments?.some(d => d.department === selectedDepartment))
                .map((c: Course) => c.id);
            filteredSchedules = filteredSchedules.filter((s: Schedule) => deptCourseIds.includes(s.course_id));
        } else if (selectedFaculty) {
            const facultyCourses = courses.filter((c: Course) => c.faculty === selectedFaculty);
            const courseIds = facultyCourses.map((c: Course) => c.id);
            filteredSchedules = filteredSchedules.filter((s: Schedule) => courseIds.includes(s.course_id));
        }

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredSchedules = filteredSchedules.filter((s: Schedule) =>
                s.course?.code?.toLowerCase().includes(term) ||
                s.course?.name?.toLowerCase().includes(term) ||
                s.course?.teacher?.name?.toLowerCase().includes(term)
            );
        }

        // Create course map for level lookup
        const courseMap = new Map(courses.map((c: Course) => [c.id, c]));

        // Group by department, then by level
        const grouped: Record<string, Record<string, Schedule[]>> = {};

        filteredSchedules.forEach((schedule: Schedule) => {
            const course = courseMap.get(schedule.course_id);
            if (!course) return;

            // Get all departments for this course
            const courseDepts = course.departments || [];

            courseDepts.forEach(dept => {
                if (selectedDepartment && dept.department !== selectedDepartment) return;

                const deptKey = dept.department;
                const levelKey = course.level || '1';

                if (!grouped[deptKey]) {
                    grouped[deptKey] = {};
                }
                if (!grouped[deptKey][levelKey]) {
                    grouped[deptKey][levelKey] = [];
                }

                // Avoid duplicates
                if (!grouped[deptKey][levelKey].some((s: Schedule) => s.id === schedule.id)) {
                    grouped[deptKey][levelKey].push(schedule);
                }
            });
        });

        return grouped;
    }, [schedules, courses, selectedFaculty, selectedDepartment, searchTerm]);

    const getScheduleForSlot = (scheduleList: Schedule[], day: string, time: string) => {
        return scheduleList.find(s => {
            const startTime = s.time_range?.split('-')[0];
            return s.day === day && startTime === time;
        });
    };

    const toggleLevel = (level: string) => {
        setExpandedLevels(prev => {
            const next = new Set(prev);
            if (next.has(level)) {
                next.delete(level);
            } else {
                next.add(level);
            }
            return next;
        });
    };

    const isLoading = schedulesLoading || coursesLoading;

    if (isLoading) {
        return (
            <div className={styles.pageContainer}>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title="Ders Programı"
                description="Bölüm ve sınıf bazlı ders programları"
                icon={Calendar}
                entity="schedules"
            />

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
                <Select value={selectedFaculty} onValueChange={(value) => {
                    setSelectedFaculty(value === 'all' ? '' : value);
                    setSelectedDepartment('');
                }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Fakülte seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Fakülteler</SelectItem>
                        {FACULTIES.map(faculty => (
                            <SelectItem key={faculty.id} value={faculty.id}>
                                {faculty.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedDepartment || 'all'}
                    onValueChange={(value) => setSelectedDepartment(value === 'all' ? '' : value)}
                    disabled={!selectedFaculty}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Bölüm seçin" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tüm Bölümler</SelectItem>
                        {departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Ders ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>

            {/* Schedule grids by department and level */}
            {Object.keys(groupedSchedules).length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Program Bulunamadı</h3>
                        <p className="text-muted-foreground">
                            Seçilen kriterlere uygun ders programı bulunmamaktadır.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedSchedules)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([deptCode, levels]) => (
                            <Card key={deptCode}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        <span>{getDepartmentName(selectedFaculty, deptCode)}</span>
                                        <Badge variant="outline" className="ml-2">
                                            {Object.values(levels).flat().length} ders
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {LEVELS.filter(level => levels[level] && levels[level].length > 0).map(level => (
                                        <Collapsible
                                            key={level}
                                            open={expandedLevels.has(level)}
                                            onOpenChange={() => toggleLevel(level)}
                                        >
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-between p-3 h-auto hover:bg-muted/50"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-primary" />
                                                        <span className="font-semibold">{level}. Sınıf</span>
                                                        <Badge variant="secondary" className="ml-2">
                                                            {levels[level].length} oturum
                                                        </Badge>
                                                    </div>
                                                    <ChevronDown className={cn(
                                                        'h-4 w-4 transition-transform',
                                                        expandedLevels.has(level) && 'rotate-180'
                                                    )} />
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="pt-2">
                                                <div className="border rounded-lg overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-muted/50">
                                                                <th className="p-2 text-left font-medium border-r w-16">Saat</th>
                                                                {DAYS.map(day => (
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
                                                            {dynamicTimeSlots.map(time => {
                                                                const isLunch = isLunchTime(time);
                                                                return (
                                                                <tr key={time} className={cn(
                                                                    'border-t',
                                                                    isLunch && 'bg-amber-50/50 dark:bg-amber-950/20'
                                                                )}>
                                                                    <td className={cn(
                                                                        'p-2 font-medium border-r text-xs',
                                                                        isLunch ? 'bg-amber-100/50 dark:bg-amber-900/30' : 'bg-muted/30'
                                                                    )}>
                                                                        {time}
                                                                        {isLunch && (
                                                                            <span className="block text-[10px] text-amber-600">🍽️ Öğle</span>
                                                                        )}
                                                                    </td>
                                                                    {DAYS.map(day => {
                                                                        const schedule = getScheduleForSlot(levels[level], day, time);

                                                                        return (
                                                                            <td
                                                                                key={`${day}-${time}`}
                                                                                className={cn(
                                                                                    'p-1 border-r last:border-r-0',
                                                                                    schedule && 'bg-primary/10',
                                                                                    isLunch && !schedule && 'bg-amber-50/30 dark:bg-amber-950/10'
                                                                                )}
                                                                            >
                                                                                {schedule ? (
                                                                                    <div className="text-xs p-1 rounded bg-primary/20">
                                                                                        <div className="flex items-center justify-between gap-1 mb-1">
                                                                                            <div className="font-medium truncate">{schedule.course?.code}</div>
                                                                                            {schedule.session_type && (
                                                                                                <Badge
                                                                                                    variant={schedule.session_type === 'lab' ? 'destructive' : 'secondary'}
                                                                                                    className="h-3 px-1 text-[9px] py-0"
                                                                                                >
                                                                                                    {schedule.session_type === 'lab' ? 'LAB' : 'TEO'}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="text-muted-foreground truncate">
                                                                                            {schedule.course?.teacher?.name}
                                                                                        </div>
                                                                                        <div className="text-muted-foreground truncate">
                                                                                            {schedule.classroom?.name}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : isLunch ? (
                                                                                    <div className="h-8 flex items-center justify-center text-xs text-amber-600/40">
                                                                                        —
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
                                            </CollapsibleContent>
                                        </Collapsible>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                </div>
            )}
        </div>
    );
}
