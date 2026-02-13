'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    BookOpen, 
    GraduationCap, 
    Users, 
    Building2, 
    Calendar, 
    Cog, 
    FileSpreadsheet,
    AlertTriangle,
    CheckCircle2,
    Info,
    ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface ModuleSectionProps {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}

function ModuleSection({ icon, title, children }: ModuleSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="font-medium">{title}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pb-4 px-3">
                {children}
            </CollapsibleContent>
        </Collapsible>
    );
}

export default function UserManualPage() {
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
                title="Kullanım Kılavuzu"
                description="PlanEdu ders programı yönetim sistemi kullanım rehberi"
                icon={BookOpen}
            />

            <div className="space-y-6">
                {/* Quick Start */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <CardTitle>Hızlı Başlangıç</CardTitle>
                        </div>
                        <CardDescription>Program oluşturmak için temel adımlar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="space-y-3">
                            <li className="flex items-start gap-3">
                                <Badge className="mt-0.5">1</Badge>
                                <div>
                                    <p className="font-medium">Öğretim Elemanlarını Ekleyin</p>
                                    <p className="text-sm text-muted-foreground">İsim, fakülte, bölüm ve uygunluk saatlerini belirleyin</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Badge className="mt-0.5">2</Badge>
                                <div>
                                    <p className="font-medium">Derslikleri Tanımlayın</p>
                                    <p className="text-sm text-muted-foreground">Kapasite, tür (teorik/lab/hibrit) ve öncelikli bölümü girin</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Badge className="mt-0.5">3</Badge>
                                <div>
                                    <p className="font-medium">Dersleri Oluşturun</p>
                                    <p className="text-sm text-muted-foreground">Oturum türleri, süreler, bölümler ve öğrenci sayılarını ekleyin</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <Badge className="mt-0.5">4</Badge>
                                <div>
                                    <p className="font-medium">Programı Oluşturun</p>
                                    <p className="text-sm text-muted-foreground">Scheduler sayfasından otomatik program oluşturma işlemini başlatın</p>
                                </div>
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                {/* Module Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle>Modül Rehberi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {/* Teachers Module */}
                        <ModuleSection 
                            icon={<Users className="h-4 w-4 text-blue-500" />}
                            title="Öğretim Elemanları"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Öğretim Elemanları modülü, akademik personelin yönetimini sağlar.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Temel Alanlar:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li><strong>Ad Soyad:</strong> Öğretim elemanının tam adı</li>
                                        <li><strong>Ünvan:</strong> Prof. Dr., Doç. Dr., Dr. Öğr. Üyesi vb.</li>
                                        <li><strong>Fakülte/Bölüm:</strong> Bağlı olduğu birim</li>
                                        <li><strong>Uygunluk Saatleri:</strong> Ders verilebilecek zaman dilimleri</li>
                                        <li><strong>Aktif/Pasif:</strong> Pasif öğretim elemanları programlamaya dahil edilmez</li>
                                    </ul>
                                </div>
                                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
                                    💡 Uygunluk saati belirtilmezse öğretim elemanı tüm saatlerde müsait kabul edilir
                                </div>
                            </div>
                        </ModuleSection>

                        {/* Classrooms Module */}
                        <ModuleSection 
                            icon={<Building2 className="h-4 w-4 text-purple-500" />}
                            title="Derslikler"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Derslikler modülü, fiziksel mekanların yönetimini sağlar.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Derslik Türleri:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li><strong>Teorik:</strong> Sadece teorik dersler için</li>
                                        <li><strong>Lab:</strong> Sadece laboratuvar oturumları için</li>
                                        <li><strong>Hibrit:</strong> Her iki tür için kullanılabilir</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Öncelikli Bölüm:</p>
                                    <p className="text-muted-foreground">
                                        Bir dersliğe öncelikli bölüm atandığında, o bölümün dersleri yerleştirmede öncelik kazanır.
                                    </p>
                                </div>
                            </div>
                        </ModuleSection>

                        {/* Courses Module */}
                        <ModuleSection 
                            icon={<GraduationCap className="h-4 w-4 text-green-500" />}
                            title="Dersler"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Dersler modülü, müfredat yönetiminin merkezidir.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Oturum Türleri:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li><strong>Teorik:</strong> Sınıf ortamında yapılan dersler</li>
                                        <li><strong>Lab:</strong> Laboratuvar uygulamaları</li>
                                        <li><strong>Tümü:</strong> Her iki ortamda yapılabilir</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Özel Özellikler:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li><strong>Çoklu Bölüm:</strong> Bir ders birden fazla bölüme açılabilir</li>
                                        <li><strong>Kapasite Marjı:</strong> Ders bazında tolerans (%0-30)</li>
                                        <li><strong>Sabit Program:</strong> Önceden belirlenmiş gün/saat ataması</li>
                                    </ul>
                                </div>
                            </div>
                        </ModuleSection>

                        {/* Scheduler Module */}
                        <ModuleSection 
                            icon={<Cog className="h-4 w-4 text-orange-500" />}
                            title="Program Oluşturucu"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Otomatik program oluşturma modülü.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Nasıl Çalışır:</p>
                                    <ol className="ml-4 list-decimal space-y-1 text-muted-foreground">
                                        <li>Aktif dersler ve derslikler yüklenir</li>
                                        <li>Sabit programlar önce yerleştirilir</li>
                                        <li>Dersler zorluk sırasına göre sıralanır</li>
                                        <li>Her ders için uygun zaman ve derslik aranır</li>
                                        <li>Son olarak yerel iyileştirme yapılır</li>
                                    </ol>
                                </div>
                                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs">
                                    ⚠️ Program oluşturma, mevcut sabit olmayan kayıtları siler
                                </div>
                            </div>
                        </ModuleSection>

                        {/* Schedule View Module */}
                        <ModuleSection 
                            icon={<Calendar className="h-4 w-4 text-red-500" />}
                            title="Ders Programı"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Oluşturulan programın görüntülenmesi ve yönetimi.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Görünümler:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li><strong>Grid:</strong> Haftalık tablo formatı</li>
                                        <li><strong>Liste:</strong> Detaylı liste görünümü</li>
                                    </ul>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Kapasite Renkleri:</p>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <span className="px-2 py-1 rounded bg-green-100 text-green-700">%50 altı</span>
                                        <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">%50-75</span>
                                        <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">%75-90</span>
                                        <span className="px-2 py-1 rounded bg-red-100 text-red-700">%90 üstü</span>
                                    </div>
                                </div>
                            </div>
                        </ModuleSection>

                        {/* Import/Export Module */}
                        <ModuleSection 
                            icon={<FileSpreadsheet className="h-4 w-4 text-teal-500" />}
                            title="İçe/Dışa Aktarım"
                        >
                            <div className="space-y-3 text-sm">
                                <p>Toplu veri aktarımı için Excel desteği.</p>
                                <div className="space-y-2">
                                    <p className="font-medium">Desteklenen İşlemler:</p>
                                    <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
                                        <li>Öğretim elemanlarını Excel&apos;den içe aktar</li>
                                        <li>Derslikleri Excel&apos;den içe aktar</li>
                                        <li>Dersleri Excel&apos;den içe aktar</li>
                                        <li>Ders programını Excel&apos;e dışa aktar</li>
                                    </ul>
                                </div>
                                <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs">
                                    💡 Örnek şablonları indirip doldurarak toplu ekleme yapabilirsiniz
                                </div>
                            </div>
                        </ModuleSection>
                    </CardContent>
                </Card>

                {/* Tips & Warnings */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-500" />
                                <CardTitle className="text-base">İpuçları</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• Önce az sayıda veri ile test edin</p>
                            <p>• Pasif öğretim elemanı/derslik/ders programlamaya dahil edilmez</p>
                            <p>• Sabit programlar her durumda korunur</p>
                            <p>• Öğretim elemanı profilinden haftalık programı görüntüleyebilirsiniz</p>
                            <p>• Filtreler ile büyük veri setlerini yönetin</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                <CardTitle className="text-base">Uyarılar</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                            <p>• Program oluşturma geri alınamaz</p>
                            <p>• Silme işlemleri kalıcıdır</p>
                            <p>• Çok sayıda ders olduğunda işlem zaman alabilir</p>
                            <p>• Yetersiz derslik varsa bazı dersler yerleştirilemez</p>
                            <p>• Öğretim elemanı çakışmaları program oluşturmayı engeller</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
