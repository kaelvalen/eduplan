'use client';

import { useState } from 'react';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import type { HardcodedSchedule, Classroom } from '@/types';

interface HardcodedScheduleFormProps {
    courseId: number;
    schedules: HardcodedSchedule[];
    classrooms: Classroom[];
    onScheduleAdded: (schedule: HardcodedSchedule) => void;
    onScheduleRemoved: (scheduleId: number) => void;
    disabled?: boolean;
}

const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'] as const;
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
] as const;

export function HardcodedScheduleForm({
    courseId,
    schedules,
    classrooms,
    onScheduleAdded,
    onScheduleRemoved,
    disabled = false,
}: HardcodedScheduleFormProps) {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        day: 'Pazartesi' as string,
        start_time: '09:00',
        end_time: '10:00',
        session_type: 'teorik' as 'teorik' | 'lab',
        classroom_id: undefined as number | undefined,
    });

    const handleAdd = async () => {
        if (formData.start_time >= formData.end_time) {
            toast.error('Bitiş saati başlangıç saatinden sonra olmalı');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}/hardcoded`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Bir hata oluştu');
            }

            const newSchedule = await response.json();
            onScheduleAdded(newSchedule);
            setIsAddDialogOpen(false);
            toast.success('Sabit program eklendi');

            // Reset form
            setFormData({
                day: 'Pazartesi',
                start_time: '09:00',
                end_time: '10:00',
                session_type: 'teorik',
                classroom_id: undefined,
            });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (scheduleId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/courses/${courseId}/hardcoded?scheduleId=${scheduleId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Bir hata oluştu');
            }

            onScheduleRemoved(scheduleId);
            toast.success('Sabit program silindi');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClassrooms = classrooms.filter((c) => {
        if (formData.session_type === 'lab') return c.type === 'lab';
        if (formData.session_type === 'teorik') return c.type !== 'lab';
        return true;
    });

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sabit Program
                    </CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddDialogOpen(true)}
                        disabled={disabled}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Ekle
                    </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                    Elle belirlenen saatler otomatik programlamada atlanır.
                </p>
            </CardHeader>
            <CardContent>
                {schedules.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Henüz sabit program eklenmemiş
                    </p>
                ) : (
                    <div className="space-y-2">
                        {schedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                            >
                                <div className="flex items-center gap-3">
                                    <Badge variant={schedule.session_type === 'teorik' ? 'default' : 'secondary'}>
                                        {schedule.session_type === 'teorik' ? 'Teorik' : 'Lab'}
                                    </Badge>
                                    <div className="text-sm">
                                        <span className="font-medium">{schedule.day}</span>
                                        <span className="text-muted-foreground mx-1">|</span>
                                        <span>{schedule.start_time} - {schedule.end_time}</span>
                                        {schedule.classroom && (
                                            <>
                                                <span className="text-muted-foreground mx-1">|</span>
                                                <span className="text-muted-foreground">{schedule.classroom.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemove(schedule.id)}
                                    disabled={disabled || isLoading}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sabit Program Ekle</DialogTitle>
                        <DialogDescription>
                            Bu ders için sabit bir zaman dilimi belirleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gün</label>
                                <Select
                                    value={formData.day}
                                    onValueChange={(value) => setFormData({ ...formData, day: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DAYS.map((day) => (
                                            <SelectItem key={day} value={day}>
                                                {day}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Oturum Türü</label>
                                <Select
                                    value={formData.session_type}
                                    onValueChange={(value: 'teorik' | 'lab') =>
                                        setFormData({ ...formData, session_type: value, classroom_id: undefined })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="teorik">Teorik</SelectItem>
                                        <SelectItem value="lab">Laboratuvar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Başlangıç</label>
                                <Select
                                    value={formData.start_time}
                                    onValueChange={(value) => {
                                        const startIndex = TIME_SLOTS.indexOf(value as typeof TIME_SLOTS[number]);
                                        const endTime = TIME_SLOTS[startIndex + 1] || TIME_SLOTS[TIME_SLOTS.length - 1];
                                        setFormData({ ...formData, start_time: value, end_time: endTime });
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.slice(0, -1).map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bitiş</label>
                                <Select
                                    value={formData.end_time}
                                    onValueChange={(value) => setFormData({ ...formData, end_time: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_SLOTS.filter((time) => time > formData.start_time).map((time) => (
                                            <SelectItem key={time} value={time}>
                                                {time}
                                            </SelectItem>
                                        ))}
                                        <SelectItem value="18:00">18:00</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Derslik (Opsiyonel)</label>
                            <Select
                                value={formData.classroom_id?.toString() || 'none'}
                                onValueChange={(value) =>
                                    setFormData({ ...formData, classroom_id: value === 'none' ? undefined : parseInt(value) })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Otomatik seçilsin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Otomatik seçilsin</SelectItem>
                                    {filteredClassrooms.map((classroom) => (
                                        <SelectItem key={classroom.id} value={classroom.id.toString()}>
                                            {classroom.name} ({classroom.capacity} kişi)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            İptal
                        </Button>
                        <Button onClick={handleAdd} disabled={isLoading}>
                            {isLoading ? 'Ekleniyor...' : 'Ekle'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
