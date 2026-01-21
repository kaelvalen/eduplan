'use client';

import { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useSchedules } from '@/hooks/use-schedules';
import { schedulesApi } from '@/lib/api';
import { DAYS_TR } from '@/constants/time';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  validateTeacherAvailability,
  validateClassroomAvailability,
  validateDepartmentConflicts,
} from '@/lib/schedule-validation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Schedule } from '@/types';

interface ScheduleEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule | null;
  onSuccess: () => void;
}

export function ScheduleEditModal({
  open,
  onOpenChange,
  schedule,
  onSuccess,
}: ScheduleEditModalProps) {
  const { data: classrooms = [] } = useClassrooms();
  const { schedules } = useSchedules();
  const schedulesRef = useRef(schedules);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: '',
    classroom_id: 0,
  });

  // Keep schedules ref updated
  useEffect(() => {
    schedulesRef.current = schedules;
  }, [schedules]);

  // Initialize form data when schedule changes
  useEffect(() => {
    if (schedule) {
      const [start, end] = (schedule.time_range || '').split('-');
      setFormData({
        day: schedule.day || '',
        startTime: start?.trim() || '',
        endTime: end?.trim() || '',
        classroom_id: schedule.classroom_id || 0,
      });
    }
  }, [schedule]);

  // Validate on form change
  useEffect(() => {
    if (!schedule || !formData.day || !formData.startTime || !formData.endTime) {
      setValidationErrors([]);
      return;
    }

    const errors: string[] = [];
    const selectedClassroom = classrooms.find((c) => c.id === formData.classroom_id);
    const currentSchedules = schedulesRef.current;

    // Teacher validation
    const teacherValidation = validateTeacherAvailability(
      schedule.course?.teacher,
      formData.day,
      formData.startTime,
      formData.endTime,
      currentSchedules,
      schedule.id
    );
    errors.push(...teacherValidation.errors);

    // Classroom validation
    const classroomValidation = validateClassroomAvailability(
      selectedClassroom,
      formData.day,
      formData.startTime,
      formData.endTime,
      currentSchedules,
      schedule.id
    );
    errors.push(...classroomValidation.errors);

    // Department conflicts validation
    const departmentValidation = validateDepartmentConflicts(
      schedule.course,
      formData.day,
      formData.startTime,
      formData.endTime,
      currentSchedules,
      schedule.id
    );
    errors.push(...departmentValidation.errors);

    setValidationErrors(errors);
  }, [formData.day, formData.startTime, formData.endTime, formData.classroom_id, schedule, classrooms]);

  const performSave = async () => {
    if (!schedule) return;

    setIsSaving(true);
    try {
      console.log('💾 Modal: Updating schedule via API...', {
        id: schedule.id,
        day: formData.day,
        time_range: `${formData.startTime}-${formData.endTime}`,
        classroom_id: formData.classroom_id,
      });
      
      await schedulesApi.update(schedule.id, {
        day: formData.day,
        time_range: `${formData.startTime}-${formData.endTime}`,
        classroom_id: formData.classroom_id,
        course_id: schedule.course_id,
        session_type: schedule.session_type,
        is_hardcoded: schedule.is_hardcoded,
      });

      console.log('✅ Modal: Update successful');
      toast.success('Ders saati güncellendi');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Modal: Update failed', error);
      const message = error?.response?.data?.error || error?.message || 'Güncelleme başarısız';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    if (!schedule) return;

    // Basic validation
    if (!formData.day || !formData.startTime || !formData.endTime || !formData.classroom_id) {
      toast.error('Tüm alanları doldurun');
      return;
    }

    // Time validation
    const startMin = timeToMinutes(formData.startTime);
    const endMin = timeToMinutes(formData.endTime);
    
    if (endMin <= startMin) {
      toast.error('Bitiş saati başlangıç saatinden büyük olmalı');
      return;
    }

    // Check validation errors - show confirmation dialog
    if (validationErrors.length > 0) {
      setShowConfirmDialog(true);
      return;
    }

    // No errors, save directly
    performSave();
  };

  // Helper: Convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  if (!schedule) return null;

  // Filter classrooms by session type
  const availableClassrooms = classrooms.filter(
    (c) =>
      c.is_active &&
      (schedule.session_type === 'tümü' ||
        c.type === schedule.session_type ||
        (schedule.session_type === 'teorik' && c.type === 'teorik') ||
        (schedule.session_type === 'lab' && c.type === 'lab'))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Ders Saati Düzenle
          </DialogTitle>
          <DialogDescription>
            {schedule.course?.code} - {schedule.course?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Course Info */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <div className="text-sm">
              <p className="font-semibold">{schedule.course?.code}</p>
              <p className="text-muted-foreground">{schedule.course?.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                👤 {schedule.course?.teacher?.name}
              </p>
            </div>
            <Badge variant={schedule.session_type === 'lab' ? 'destructive' : 'secondary'}>
              {schedule.session_type === 'lab' ? 'Laboratuvar' : 'Teorik'}
            </Badge>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label htmlFor="day" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Gün
            </Label>
            <Select value={formData.day} onValueChange={(value) => setFormData({ ...formData, day: value })}>
              <SelectTrigger id="day">
                <SelectValue placeholder="Gün seçin" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_TR.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Başlangıç Saati</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Bitiş Saati</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="classroom" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Derslik
            </Label>
            <Select
              value={String(formData.classroom_id)}
              onValueChange={(value) => setFormData({ ...formData, classroom_id: Number(value) })}
            >
              <SelectTrigger id="classroom">
                <SelectValue placeholder="Derslik seçin" />
              </SelectTrigger>
              <SelectContent>
                {availableClassrooms.length === 0 ? (
                  <SelectItem value="0" disabled>
                    Uygun derslik yok
                  </SelectItem>
                ) : (
                  availableClassrooms.map((classroom) => (
                    <SelectItem key={classroom.id} value={String(classroom.id)}>
                      {classroom.name} (Kapasite: {classroom.capacity})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            İptal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Kaydediliyor...' : validationErrors.length > 0 ? 'Uyarılarla Devam Et' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Uyarılar Var"
        description="Aşağıdaki uyarıları göz ardı ederek kaydetmek istiyor musun?"
        warnings={validationErrors}
        onConfirm={() => {
          setShowConfirmDialog(false);
          performSave();
        }}
        onCancel={() => {
          setShowConfirmDialog(false);
        }}
      />
    </Dialog>
  );
}
