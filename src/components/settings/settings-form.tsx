'use client';

import { useState, useEffect } from 'react';
import { Save, Clock, Percent, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { settingsApi } from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { SystemSettings } from '@/types';

export function SettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsApi.update(settings);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card className="border-primary/20 shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Sistem Yapılandırması</CardTitle>
            <CardDescription>
              Zamanlama algoritması ve genel sistem parametrelerini yapılandırın.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Configuration */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" /> Zaman Ayarları
          </h3>
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="day_start">Gün Başlangıç Saati</Label>
              <Input
                id="day_start"
                type="time"
                value={settings.day_start}
                onChange={(e) => setSettings({ ...settings, day_start: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">Derslerin başlayabileceği en erken saat.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day_end">Gün Bitiş Saati</Label>
              <Input
                id="day_end"
                type="time"
                value={settings.day_end}
                onChange={(e) => setSettings({ ...settings, day_end: e.target.value })}
              />
              <p className="text-[10px] text-muted-foreground">Derslerin bitebileceği en geç saat.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lunch_break_start">Öğle Arası Başlangıç</Label>
              <Input
                id="lunch_break_start"
                type="time"
                value={settings.lunch_break_start}
                onChange={(e) => setSettings({ ...settings, lunch_break_start: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lunch_break_end">Öğle Arası Bitiş</Label>
              <Input
                id="lunch_break_end"
                type="time"
                value={settings.lunch_break_end}
                onChange={(e) => setSettings({ ...settings, lunch_break_end: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Ders Süresi (Dakika)</Label>
              <Select
                value={String(settings.slot_duration)}
                onValueChange={(value) => setSettings({ ...settings, slot_duration: Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Süre seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Dakika</SelectItem>
                  <SelectItem value="40">40 Dakika</SelectItem>
                  <SelectItem value="45">45 Dakika</SelectItem>
                  <SelectItem value="50">50 Dakika</SelectItem>
                  <SelectItem value="60">60 Dakika</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Bir ders bloğunun süresi. Genellikle 45-60 dakika.
              </p>
            </div>
          </div>
        </div>

        {/* Capacity Configuration */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Percent className="h-4 w-4" /> Kapasite Ayarları
          </h3>
          <Separator />

          <div className="space-y-6">
            <div className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
              <div className="space-y-0.5">
                <Label className="text-base">Kapasite Marjı</Label>
                <div className="text-sm text-muted-foreground">
                  Derslik kapasitelerini esnek tutmak için marj ekleyin.
                </div>
              </div>
              <Switch
                checked={settings.capacity_margin_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, capacity_margin_enabled: checked })}
              />
            </div>

            {settings.capacity_margin_enabled && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex justify-between items-center">
                  <Label>Marj Oranı: %{settings.capacity_margin_percent}</Label>
                </div>
                <Slider
                  defaultValue={[settings.capacity_margin_percent]}
                  max={30}
                  step={5}
                  onValueChange={(vals) => setSettings({ ...settings, capacity_margin_percent: vals[0] })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Bu özellik açıldığında, 50 kişilik bir derslik %10 marj ile 55 kişilik dersleri alabilir.
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 bg-muted/10 p-4">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          İptal / Yenile
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <span className="animate-spin mr-2">⏳</span> Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Değişiklikleri Kaydet
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
