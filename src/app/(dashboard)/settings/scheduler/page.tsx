'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, Percent, AlertCircle, Clock, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { settingsApi } from '@/lib/api';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { SystemSettings } from '@/types';

// Time options
const TIME_OPTIONS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function SchedulerSettingsPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Capacity margin state
    const [capacityMarginEnabled, setCapacityMarginEnabled] = useState(false);
    const [capacityMarginPercent, setCapacityMarginPercent] = useState(0);

    // Time configuration state
    const [slotDuration, setSlotDuration] = useState(60);
    const [dayStart, setDayStart] = useState('08:00');
    const [dayEnd, setDayEnd] = useState('18:00');
    const [lunchBreakStart, setLunchBreakStart] = useState('12:00');
    const [lunchBreakEnd, setLunchBreakEnd] = useState('13:00');

    useEffect(() => {
        if (!isAdmin) {
            router.push('/');
            return;
        }
        fetchSettings();
    }, [isAdmin, router]);

    const fetchSettings = async () => {
        try {
            const data = await settingsApi.get();
            setSettings(data);
            setCapacityMarginEnabled(data.capacity_margin_enabled);
            setCapacityMarginPercent(data.capacity_margin_percent);
            // Time settings (with fallback defaults)
            setSlotDuration(data.slot_duration ?? 60);
            setDayStart(data.day_start ?? '08:00');
            setDayEnd(data.day_end ?? '18:00');
            setLunchBreakStart(data.lunch_break_start ?? '12:00');
            setLunchBreakEnd(data.lunch_break_end ?? '13:00');
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Ayarlar yüklenirken bir hata oluştu');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const updatedSettings = await settingsApi.update({
                capacity_margin_enabled: capacityMarginEnabled,
                capacity_margin_percent: capacityMarginPercent,
                slot_duration: slotDuration,
                day_start: dayStart,
                day_end: dayEnd,
                lunch_break_start: lunchBreakStart,
                lunch_break_end: lunchBreakEnd,
            });
            setSettings(updatedSettings);
            setHasChanges(false);
            toast.success('Ayarlar kaydedildi');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Ayarlar kaydedilirken bir hata oluştu');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleMargin = (enabled: boolean) => {
        setCapacityMarginEnabled(enabled);
        setHasChanges(true);
    };

    const handlePercentChange = (value: number[]) => {
        setCapacityMarginPercent(value[0]);
        setHasChanges(true);
    };

    const handleTimeChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setHasChanges(true);
    };

    const handleSlotDurationChange = (value: string) => {
        setSlotDuration(parseInt(value));
        setHasChanges(true);
    };

    if (!isAdmin) {
        return null;
    }

    if (isLoading) {
        return (
            <div className={styles.pageContainer}>
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
                        <div className="h-4 w-64 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2, 3].map((i) => (
                        <CardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <PageHeader
                title="Scheduler Ayarları"
                description="Program oluşturma algoritmasının davranışını yapılandırın"
                icon={Settings}
                entity="scheduler"
                action={
                    <Button
                        size="lg"
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        <Save className="mr-2 h-5 w-5" />
                        {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                    </Button>
                }
            />

            {hasChanges && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-orange-700 dark:text-orange-300">
                        Kaydedilmemiş değişiklikler var
                    </span>
                </div>
            )}

            {/* Settings Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Time Configuration */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <CardTitle>Zaman Yapılandırması</CardTitle>
                        </div>
                        <CardDescription>
                            Ders programı için zaman dilimlerini ve öğle arasını ayarlayın
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Slot Duration */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Timer className="h-4 w-4" />
                                    Ders Bloğu Süresi
                                </label>
                                <Select value={String(slotDuration)} onValueChange={handleSlotDurationChange}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 dakika</SelectItem>
                                        <SelectItem value="60">60 dakika</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Day Start */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gün Başlangıcı</label>
                                <Select value={dayStart} onValueChange={handleTimeChange(setDayStart)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_OPTIONS.map(time => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Day End */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Gün Bitişi</label>
                                <Select value={dayEnd} onValueChange={handleTimeChange(setDayEnd)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TIME_OPTIONS.map(time => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Lunch Break */}
                        <div className="border-t pt-6">
                            <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                                🍽️ Öğle Arası
                            </h4>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Başlangıç</label>
                                    <Select value={lunchBreakStart} onValueChange={handleTimeChange(setLunchBreakStart)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm text-muted-foreground">Bitiş</label>
                                    <Select value={lunchBreakEnd} onValueChange={handleTimeChange(setLunchBreakEnd)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TIME_OPTIONS.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="p-4 rounded-lg bg-muted/50 text-sm">
                            <strong>Önizleme:</strong>{' '}
                            {dayStart} - {dayEnd} arası, {slotDuration} dakikalık bloklar.
                            Öğle arası: {lunchBreakStart} - {lunchBreakEnd}
                        </div>
                    </CardContent>
                </Card>

                {/* Capacity Margin */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Percent className="h-5 w-5 text-primary" />
                                <CardTitle>Kapasite Marjı</CardTitle>
                            </div>
                            <Switch
                                checked={capacityMarginEnabled}
                                onCheckedChange={handleToggleMargin}
                            />
                        </div>
                        <CardDescription>
                            Sınıf kapasitesinden daha fazla öğrenci sayısına sahip derslerin yerleştirilmesine izin ver
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className={capacityMarginEnabled ? '' : 'opacity-50 pointer-events-none'}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">Marj Yüzdesi</span>
                                <span className="text-2xl font-bold">{capacityMarginPercent}%</span>
                            </div>
                            <Slider
                                value={[capacityMarginPercent]}
                                onValueChange={handlePercentChange}
                                max={30}
                                step={5}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>0%</span>
                                <span>30%</span>
                            </div>
                        </div>

                        {capacityMarginEnabled && (
                            <div className="p-3 rounded-lg bg-muted/50 text-sm">
                                <strong>Örnek:</strong> %{capacityMarginPercent} marj ile
                                <br />
                                <span className="text-muted-foreground">
                                    100 kişilik bir ders, {Math.ceil(100 * (1 - capacityMarginPercent / 100))} kapasiteli sınıfa yerleştirilebilir
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Algoritma Hakkında</CardTitle>
                        <CardDescription>
                            Otomatik program oluşturma hakkında bilgi
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>
                            <strong>Zaman Blokları:</strong> {slotDuration} dakikalık periyotlar ({dayStart}-{dayEnd})
                        </p>
                        <p>
                            <strong>Öğle Arası:</strong> {lunchBreakStart}-{lunchBreakEnd} arası ders yerleştirilmez
                        </p>
                        <p>
                            <strong>Oturum Bölme:</strong> Çok saatlik oturumlar {slotDuration} dakikalık bloklara bölünür
                        </p>
                        <p>
                            <strong>Derslik Türleri:</strong> Lab oturumları laboratuvara, teorik oturumlar dersliğe yerleştirilir
                        </p>
                        <p>
                            <strong>Öncelik:</strong> Derslik koduna göre bölüm önceliği uygulanır
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
