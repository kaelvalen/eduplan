'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Cog, Zap, Clock, Users, Target, Shuffle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';

export default function SchedulerSettingsPage() {
    const { isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAdmin) {
            router.push('/');
        }
    }, [isAdmin, router]);

    if (!isAdmin) {
        return null;
    }

    return (
        <div className={styles.pageContainer}>
            <PageHeader
                title="Scheduler Bilgileri"
                description="Otomatik program oluşturma algoritması hakkında bilgi"
                icon={Settings}
                entity="scheduler"
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Algorithm Overview */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Cog className="h-5 w-5 text-primary" />
                            <CardTitle>Algoritma Özeti</CardTitle>
                        </div>
                        <CardDescription>
                            Smart Greedy + Hill Climbing hibrit yaklaşımı
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Target className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Zorluk Bazlı Sıralama</p>
                                    <p className="text-xs text-muted-foreground">
                                        En kısıtlı dersler önce yerleştirilir
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <Shuffle className="h-5 w-5 text-purple-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Rastgele Keşif</p>
                                    <p className="text-xs text-muted-foreground">
                                        Gün ve saat seçiminde rastgelelik
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Yerel İyileştirme</p>
                                    <p className="text-xs text-muted-foreground">
                                        Hill Climbing ile optimizasyon
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Hard Constraints */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-red-500" />
                            <CardTitle>Kesin Kısıtlar</CardTitle>
                            <Badge variant="destructive" className="ml-auto">Zorunlu</Badge>
                        </div>
                        <CardDescription>
                            İhlal edilemez kurallar
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span><strong>Öğretmen çakışması:</strong> Bir öğretmen aynı anda bir yerde</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span><strong>Derslik çakışması:</strong> Bir derslik aynı anda bir ders</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span><strong>Zorunlu ders çakışması:</strong> Aynı dönem ve sınıfta çakışma yok</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span><strong>Kapasite:</strong> Öğrenci sayısı ≤ Derslik kapasitesi</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-red-500">•</span>
                            <span><strong>Tür uyumu:</strong> Lab → Lab/Hibrit, Teorik → Teorik/Hibrit</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Soft Constraints */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-amber-500" />
                            <CardTitle>Esnek Kısıtlar</CardTitle>
                            <Badge variant="outline" className="ml-auto">Optimize</Badge>
                        </div>
                        <CardDescription>
                            İyileştirme hedefleri
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Kapasite kullanımı:</strong> %70-90 ideal doluluk oranı</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Bölüm önceliği:</strong> Dersliklerin öncelikli bölümü tercih edilir</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Öğretmen yükü dengesi:</strong> Saatler eşit dağıtılır</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="text-amber-500">•</span>
                            <span><strong>Gün dağılımı:</strong> Ders oturumları farklı günlere yayılır</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Special Features */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <CardTitle>Özel Özellikler</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
                            <div className="p-3 rounded-lg border">
                                <p className="font-medium mb-1">📌 Sabit Programlar</p>
                                <p className="text-xs text-muted-foreground">
                                    Ders bazında önceden tanımlı zaman ve derslik
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border">
                                <p className="font-medium mb-1">📊 Ders Bazlı Kapasite Marjı</p>
                                <p className="text-xs text-muted-foreground">
                                    Her ders için ayrı kapasite toleransı (0-30%)
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border">
                                <p className="font-medium mb-1">🧩 Çok Bloklu Oturumlar</p>
                                <p className="text-xs text-muted-foreground">
                                    2+ saatlik dersler ardışık bloklara yerleştirilir
                                </p>
                            </div>
                            <div className="p-3 rounded-lg border">
                                <p className="font-medium mb-1">🕐 Uygunluk Saatleri</p>
                                <p className="text-xs text-muted-foreground">
                                    Öğretmen ve derslik bazlı uygunluk kontrolü
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
