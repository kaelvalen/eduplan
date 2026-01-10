'use client';

import { useMemo, useState } from 'react';
import { 
  Trash2, 
  Download, 
  Filter, 
  Grid3X3, 
  List, 
  Calendar as CalendarIcon,
  Search,
  X,
  Printer,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSchedules } from '@/hooks/use-schedules';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { NoSchedule } from '@/components/ui/empty-state';
import { ScheduleSkeleton } from '@/components/ui/skeleton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
const DAYS_TR: Record<string, string> = {
  Monday: 'Pazartesi',
  Tuesday: 'Salı',
  Wednesday: 'Çarşamba',
  Thursday: 'Perşembe',
  Friday: 'Cuma',
};

const TIME_SLOTS = [
  '08:00-08:30', '08:30-09:00', '09:00-09:30', '09:30-10:00',
  '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
  '12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00',
  '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
  '16:00-16:30', '16:30-17:00',
];

type ViewMode = 'grid' | 'list';

// Lunch break helper
const LUNCH_SLOTS = ['12:00-12:30', '12:30-13:00'];
const isLunchSlot = (slot: string) => LUNCH_SLOTS.includes(slot);

export default function SchedulesPage() {
  const { schedules, isLoading, deleteByDays, fetchSchedules } = useSchedules();
  const { isAdmin } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');

  // Get unique classrooms
  const classrooms = useMemo(() => {
    const unique = new Set(schedules.map(s => s.classroom?.name).filter(Boolean));
    return Array.from(unique).sort();
  }, [schedules]);

  // Filter schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter(schedule => {
      const matchesSearch = !searchQuery || 
        schedule.course?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.course?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.classroom?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schedule.course?.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDay = selectedDay === 'all' || schedule.day === selectedDay;
      const matchesClassroom = selectedClassroom === 'all' || schedule.classroom?.name === selectedClassroom;
      
      return matchesSearch && matchesDay && matchesClassroom;
    });
  }, [schedules, searchQuery, selectedDay, selectedClassroom]);

  // Build schedule grid
  const scheduleGrid = useMemo(() => {
    const grid: Record<string, Record<string, typeof schedules>> = {};
    
    DAYS.forEach((day) => {
      grid[day] = {};
      TIME_SLOTS.forEach((slot) => {
        grid[day][slot] = [];
      });
    });

    filteredSchedules.forEach((schedule) => {
      const { day, time_range } = schedule;
      if (!DAYS.includes(day as typeof DAYS[number])) return;

      const [start, end] = time_range.split('-');
      const toMinutes = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const startMin = toMinutes(start);
      const endMin = toMinutes(end);

      TIME_SLOTS.forEach((slot) => {
        const [slotStart, slotEnd] = slot.split('-');
        const slotStartMin = toMinutes(slotStart);
        const slotEndMin = toMinutes(slotEnd);

        if (slotStartMin >= startMin && slotEndMin <= endMin) {
          grid[day][slot].push(schedule);
        }
      });
    });

    return grid;
  }, [filteredSchedules]);

  const handleDeleteAll = async () => {
    const uniqueDays = [...new Set(schedules.map((s) => s.day))];
    await deleteByDays(uniqueDays);
    setDeleteConfirm(false);
    fetchSchedules();
  };

  const handleExport = () => {
    const data = filteredSchedules.map(s => ({
      'Gün': DAYS_TR[s.day] || s.day,
      'Saat': s.time_range,
      'Ders Kodu': s.course?.code || '',
      'Ders Adı': s.course?.name || '',
      'Derslik': s.classroom?.name || '',
      'Öğretmen': s.course?.teacher?.name || '',
      'Kapasite': s.classroom?.capacity || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ders Programı');
    XLSX.writeFile(wb, `ders_programi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getCapacityColor = (schedule: typeof schedules[0]) => {
    if (!schedule.classroom || !schedule.course) return '';
    const studentCount = schedule.course.student_count || 0;
    const capacity = schedule.classroom.capacity || 0;
    if (capacity === 0) return '';
    const ratio = (studentCount / capacity) * 100;
    if (ratio > 90) return 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-800';
    if (ratio > 75) return 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-800';
    if (ratio > 50) return 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-800';
    return 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-800';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDay('all');
    setSelectedClassroom('all');
  };

  const hasFilters = searchQuery || selectedDay !== 'all' || selectedClassroom !== 'all';

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <ScheduleSkeleton />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <PageHeader
        title="Ders Programı"
        description={filteredSchedules.length !== schedules.length 
          ? `${filteredSchedules.length} / ${schedules.length} kayıt gösteriliyor`
          : `${schedules.length} ders programı kayıtlı`
        }
        icon={CalendarIcon}
        entity="schedules"
        action={
          <div className="flex flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex border rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Export Dropdown */}
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ders, derslik veya öğretmen ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Gün seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Günler</SelectItem>
                {DAYS.map((day) => (
                  <SelectItem key={day} value={day}>
                    {DAYS_TR[day]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Derslik seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Derslikler</SelectItem>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom} value={classroom as string}>
                    {classroom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <NoSchedule onGenerate={isAdmin ? () => window.location.href = '/scheduler' : undefined} />
          </CardContent>
        </Card>
      ) : filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg text-muted-foreground">Filtrelere uygun kayıt bulunamadı.</p>
            <Button variant="link" onClick={clearFilters}>
              Filtreleri Temizle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Haftalık Program</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border bg-muted p-2 text-left font-medium">Saat</th>
                  {DAYS.map((day) => (
                    <th key={day} className="border bg-muted p-2 text-center font-medium">
                      {DAYS_TR[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => {
                  const isLunch = isLunchSlot(slot);
                  return (
                  <tr key={slot} className={isLunch ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                    <td className={cn(
                      'border p-2 font-medium',
                      isLunch ? 'bg-amber-100/50 dark:bg-amber-900/30' : 'bg-muted/50'
                    )}>
                      {slot}
                      {isLunch && slot === '12:00-12:30' && (
                        <span className="block text-[10px] text-amber-600 dark:text-amber-400">🍽️</span>
                      )}
                    </td>
                    {DAYS.map((day) => {
                      const items = scheduleGrid[day][slot];
                      return (
                        <td key={`${day}-${slot}`} className={cn(
                          'border p-1',
                          isLunch && 'bg-amber-50/30 dark:bg-amber-950/10'
                        )}>
                          {isLunch && items.length === 0 ? (
                            <div className="h-8 flex items-center justify-center text-xs text-amber-600/50 dark:text-amber-400/50">
                              {slot === '12:00-12:30' ? 'Öğle' : 'Arası'}
                            </div>
                          ) : items.length === 0 ? (
                            <div className="h-8" />
                          ) : (
                            items.map((item, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  'rounded border p-1 text-xs',
                                  getCapacityColor(item)
                                )}
                                title={`${item.course?.name || ''} (${item.course?.code || ''})\n${item.classroom?.name || ''}\n${item.course?.student_count || 0} / ${item.classroom?.capacity || 0}`}
                              >
                                <div className="font-medium truncate">
                                  {item.course?.name}
                                </div>
                                <div className="text-muted-foreground truncate">
                                  {item.classroom?.name}
                                </div>
                              </div>
                            ))
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      {schedules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kapasite Durumu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-green-300 bg-green-100" />
                <span>%50 altı</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-yellow-300 bg-yellow-100" />
                <span>%50-75</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-orange-300 bg-orange-100" />
                <span>%75-90</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded border border-red-300 bg-red-100" />
                <span>%90 üstü</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tüm Programı Sil</DialogTitle>
            <DialogDescription>
              Tüm ders programını silmek istediğinizden emin misiniz?
              Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll}>
              Tümünü Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
