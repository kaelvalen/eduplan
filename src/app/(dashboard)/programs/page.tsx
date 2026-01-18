'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Building2, Users, ChevronDown, Trash2, Download, Printer, Search, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchedules } from '@/hooks/use-schedules';
import { useCourses } from '@/hooks/use-courses';
import { useAuth } from '@/contexts/auth-context';
import { getDepartmentName, FACULTIES, DEPARTMENTS } from '@/constants/faculties';
import { DAYS_TR as DAYS, DAYS_EN_TO_TR, DAYS_TR_TO_EN } from '@/constants/time';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Schedule, Course, SystemSettings } from '@/types';

const LEVELS = ['1', '2', '3', '4'] as const;

export default function ProgramViewPage() {
    const { schedules, isLoading: schedulesLoading, deleteByDays, fetchSchedules } = useSchedules();
    const { data: courses = [], isLoading: coursesLoading } = useCourses();
    const { isAdmin } = useAuth();
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    const [selectedFaculty, setSelectedFaculty] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['1', '2', '3', '4']));
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Fetch time settings for lunch break detection and dynamic slots
    useEffect(() => {
        fetch('/api/settings', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => data && setSettings(data))
            .catch(console.error);
    }, []);

    // Generate dynamic time slots based on settings
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
        const slotDuration = settings?.slot_duration || 60;
        
        const slots: string[] = [];
        for (let current = startMin; current < endMin; current += slotDuration) {
            const blockEnd = Math.min(current + slotDuration, endMin);
            // We no longer skip lunch slots here to ensure any course scheduled during lunch is visible
            slots.push(`${fromMinutes(current)}-${fromMinutes(blockEnd)}`);
        }
        
        return slots;
    }, [settings]);

    // Dynamic lunch break detection based on settings
    const isLunchSlot = (slot: string) => {
        if (!settings) return false;
        const [start, end] = slot.split('-');
        const toMinutes = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return h * 60 + m;
        };
        const sMin = toMinutes(start);
        const eMin = toMinutes(end);
        const lSMin = toMinutes(settings.lunch_break_start || '12:00');
        const lEMin = toMinutes(settings.lunch_break_end || '13:00');
        
        return sMin < lEMin && eMin > lSMin;
    };

    // Get departments for selected faculty
    const departments = useMemo(() => {
        if (!selectedFaculty) return [];
        return DEPARTMENTS[selectedFaculty] || [];
    }, [selectedFaculty]);

    // Group schedules by department and level
    const groupedSchedules = useMemo(() => {
        console.log('🔄 Grouping schedules...', { schedulesCount: schedules?.length, coursesCount: courses?.length });
        
        if (!schedules || !courses) {
            console.log('⚠️ Missing data:', { schedules: !!schedules, courses: !!courses });
            return {};
        }

        // Search filter
        let filteredSchedules = [...schedules];
        console.log('📊 Total schedules before filtering:', filteredSchedules.length);

        // Create course map for level and department lookup
        const courseMap = new Map((courses || []).filter((c: Course) => c.id !== undefined).map((c: Course) => [c.id!, c]));
        console.log('🗺️ Course map size:', courseMap.size);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filteredSchedules = filteredSchedules.filter((s: Schedule) =>
                s.course?.code?.toLowerCase().includes(term) ||
                s.course?.name?.toLowerCase().includes(term) ||
                s.course?.teacher?.name?.toLowerCase().includes(term)
            );
        }

        // Group by department, then by level
        const grouped: Record<string, Record<string, Schedule[]>> = {};

        filteredSchedules.forEach((schedule: Schedule, index: number) => {
            // Get course data
            const sCourse = schedule.course;
            const fullCourse = schedule.course_id ? courseMap.get(schedule.course_id) : null;
            
            if (index === 0) {
                console.log('📖 First schedule details:', {
                    schedule_id: schedule.id,
                    course_id: schedule.course_id,
                    sCourse,
                    fullCourse,
                    faculty: (fullCourse as Course | undefined)?.faculty,
                    level: (fullCourse as Course | undefined)?.level,
                    departments: (fullCourse as Course | undefined)?.departments,
                });
            }
            
            // Faculty filter - ALLOW if no faculty selected OR faculty matches
            if (selectedFaculty && fullCourse && (fullCourse as Course).faculty !== selectedFaculty) {
                console.log('❌ Filtered by faculty:', schedule.id, (fullCourse as Course).faculty, '!==', selectedFaculty);
                return;
            }

            // Get all departments for this course
            const courseDepts = (fullCourse as Course | undefined)?.departments || [];

            const processDept = (deptName: string) => {
                if (selectedDepartment && deptName !== selectedDepartment) return;

                const levelKey = (fullCourse as Course | undefined)?.level || (sCourse as Course)?.level || '1';

                if (!grouped[deptName]) {
                    grouped[deptName] = {};
                }
                if (!grouped[deptName][levelKey]) {
                    grouped[deptName][levelKey] = [];
                }

                // Avoid duplicates
                if (!grouped[deptName][levelKey].some((s: Schedule) => s.id === schedule.id)) {
                    grouped[deptName][levelKey].push(schedule);
                }
            };

            if (courseDepts.length > 0) {
                courseDepts.forEach((dept: { department: string; student_count: number }) => processDept(dept.department));
            } else if (fullCourse) {
                processDept('Genel');
            } else if (sCourse) {
                processDept('Genel');
            }
        });

        console.log('✅ Grouped schedules result:', Object.keys(grouped).length, 'departments');
        console.log('📦 Grouped structure:', Object.keys(grouped).map(dept => ({
            dept,
            levels: Object.keys(grouped[dept]),
            totalSchedules: Object.values(grouped[dept]).flat().length
        })));

        return grouped;
    }, [schedules, courses, selectedFaculty, selectedDepartment, searchTerm]);

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

    const handleExport = () => {
        // Create course map for lookup during export
        const courseMap = new Map(courses.filter((c: Course) => c.id !== undefined).map((c: Course) => [c.id!, c]));

        // Flatten the groupedSchedules for export
        const exportData = Object.values(groupedSchedules).flatMap(levels => 
            Object.values(levels).flat()
        ).map(s => {
            const fullCourse = s.course_id ? courseMap.get(s.course_id) : null;
            return {
                'Bölüm': (fullCourse as Course | undefined)?.departments?.[0]?.department || '',
                'Sınıf': (fullCourse as Course | undefined)?.level || '',
                'Gün': DAYS_EN_TO_TR[s.day] || s.day,
                'Saat': s.time_range,
                'Ders Kodu': s.course?.code || '',
                'Ders Adı': s.course?.name || '',
                'Derslik': s.classroom?.name || '',
                'Öğretmen': s.course?.teacher?.name || '',
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ders Programı');
        XLSX.writeFile(wb, `ders_programi_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDeleteAll = async () => {
        const uniqueDays = [...new Set(schedules.map((s) => s.day))];
        await deleteByDays(uniqueDays);
        setDeleteConfirm(false);
        fetchSchedules();
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
                action={
                    <div className="flex flex-wrap gap-2 print:hidden">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Dışa Aktar
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Excel&apos;e Aktar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Yazdır
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isAdmin && schedules.length > 0 && (
                            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Tümünü Sil
                            </Button>
                        )}
                    </div>
                }
            />
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tüm Programı Sil?</DialogTitle>
                        <DialogDescription>
                            Tüm haftalık ders programı kayıtları silinecektir. Bu işlem geri alınamaz.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(false)}>İptal</Button>
                        <Button variant="destructive" onClick={handleDeleteAll}>Evet, Tümünü Sil</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

                {(selectedFaculty || selectedDepartment || searchTerm) && (
                    <Button variant="ghost" size="icon" onClick={() => {
                        setSelectedFaculty('');
                        setSelectedDepartment('');
                        setSearchTerm('');
                    }}>
                        <X className="h-4 w-4" />
                    </Button>
                )}
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
                                                            {dynamicTimeSlots.map((slot) => {
                                                                const isLunch = isLunchSlot(slot);
                                                                return (
                                                                <tr key={slot} className={cn(
                                                                    'border-t',
                                                                    isLunch && 'bg-amber-50/50 dark:bg-amber-950/20'
                                                                )}>
                                                                    <td className={cn(
                                                                        'p-2 font-medium border-r text-xs',
                                                                        isLunch ? 'bg-amber-100/50 dark:bg-amber-900/30' : 'bg-muted/30'
                                                                    )}>
                                                                        {slot}
                                                                        {isLunch && slot.startsWith('12:') && (
                                                                            <span className="block text-[10px] text-amber-600">🍽️ Öğle</span>
                                                                        )}
                                                                    </td>
                                                                    {DAYS.map(dayTr => {
                                                                        const schedule = levels[level].find(s => {
                                                                            const sDay = (s.day || '').toLowerCase();
                                                                            const targetTr = dayTr.toLowerCase();
                                                                            const targetEn = (DAYS_TR_TO_EN[dayTr as keyof typeof DAYS_TR_TO_EN] || '').toLowerCase();
                                                                            
                                                                            const dayMatch = sDay === targetTr || sDay === targetEn;
                                                                            if (!dayMatch) return false;

                                                                            const [sStart] = (s.time_range || '').split('-');
                                                                            const [slotStart] = slot.split('-');
                                                                            return sStart.trim() === slotStart.trim();
                                                                        });

                                                                         const isOccupied = levels[level].some(s => {
                                                                            const sDay = (s.day || '').toLowerCase();
                                                                            const targetTr = dayTr.toLowerCase();
                                                                            const targetEn = (DAYS_TR_TO_EN[dayTr as keyof typeof DAYS_TR_TO_EN] || '').toLowerCase();
                                                                            
                                                                            const dayMatch = sDay === targetTr || sDay === targetEn;
                                                                            if (!dayMatch) return false;

                                                                            const [sStart, sEnd] = (s.time_range || '').split('-');
                                                                            const [slotStart, slotEnd] = slot.split('-');
                                                                            
                                                                            const toMin = (t: string) => {
                                                                                const [h, m] = (t || '00:00').trim().split(':').map(Number);
                                                                                return h * 60 + m;
                                                                            };
                                                                            const sMin = toMin(sStart);
                                                                            const eMin = toMin(sEnd);
                                                                            const slSMin = toMin(slotStart);
                                                                            const slEMin = toMin(slotEnd || slotStart);
                                                                            
                                                                            // Occupied if this is NOT the start slot but it's within the range
                                                                            return slSMin >= sMin && slEMin <= eMin && sStart.trim() !== slotStart.trim();
                                                                        });

                                                                        if (isOccupied) return null;

                                                                        let rowSpan = 1;
                                                                        if (schedule) {
                                                                            const [sStart, sEnd] = (schedule.time_range || '').split('-');
                                                                            const toMin = (t: string) => {
                                                                                const [h, m] = (t || '00:00').split(':').map(Number);
                                                                                return h * 60 + m;
                                                                            };
                                                                            const duration = toMin(sEnd) - toMin(sStart);
                                                                            const slotDur = settings?.slot_duration || 60;
                                                                            rowSpan = Math.max(1, Math.round(duration / slotDur));
                                                                        }

                                                                        return (
                                                                            <td
                                                                                key={`${dayTr}-${slot}`}
                                                                                rowSpan={rowSpan}
                                                                                className={cn(
                                                                                    'p-1 border-r last:border-r-0 align-top',
                                                                                    schedule && 'bg-primary/5',
                                                                                    isLunch && !schedule && 'bg-amber-50/30 dark:bg-amber-950/10'
                                                                                )}
                                                                            >
                                                                                {schedule ? (
                                                                                    <div className="text-xs p-2 rounded border bg-card shadow-sm h-full flex flex-col justify-center">
                                                                                        <div className="flex items-center justify-between gap-1 mb-1">
                                                                                            <div className="font-bold text-sm text-primary truncate">
                                                                                                {schedule.course?.code}
                                                                                            </div>
                                                                                            {schedule.session_type && (
                                                                                                <Badge
                                                                                                    variant={schedule.session_type === 'lab' ? 'destructive' : 'secondary'}
                                                                                                    className="h-4 px-1 text-[10px] py-0"
                                                                                                >
                                                                                                    {schedule.session_type === 'lab' ? 'LAB' : 'TEO'}
                                                                                                </Badge>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="font-medium mb-1 line-clamp-2">
                                                                                            {schedule.course?.name}
                                                                                        </div>
                                                                                        <div className="text-muted-foreground truncate text-[10px]">
                                                                                            👤 {schedule.course?.teacher?.name}
                                                                                        </div>
                                                                                        <div className="text-muted-foreground truncate text-[10px]">
                                                                                            📍 {schedule.classroom?.name}
                                                                                        </div>
                                                                                        {rowSpan > 1 && (
                                                                                            <div className="mt-1 pt-1 border-t text-[9px] text-muted-foreground">
                                                                                                🕒 {schedule.time_range}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                ) : isLunch ? (
                                                                                    <div className="h-8 flex items-center justify-center text-xs text-amber-600/40 font-medium">
                                                                                        ARA
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="h-8" />
                                                                                )}
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
