'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Save, Percent, AlertCircle } from 'lucide-react';
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
import type { SystemSettings } from '@/types';

export default function SchedulerSettingsPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Local form state
    const [capacityMarginEnabled, setCapacityMarginEnabled] = useState(false);
    const [capacityMarginPercent, setCapacityMarginPercent] = useState(0);

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
                    {[1, 2].map((i) => (
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
                            <strong>Zaman Blokları:</strong> 1 saatlik periyotlar (08:00-18:00)
                        </p>
                        <p>
                            <strong>Oturum Bölme:</strong> Çok saatlik oturumlar 1 saatlik bloklara bölünür
                        </p>
                        <p>
                            <strong>Derslik Türleri:</strong> Lab oturumları laboratuvara, teorik oturumlar dersliğe yerleştirilir
                        </p>
                        <p>
                            <strong>Öncelik:</strong> Derslik koduna göre bölüm önceliği uygulanır
                        </p>
                        <p>
                            <strong>Hardcoded:</strong> Elle belirlenen saatler korunur
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
