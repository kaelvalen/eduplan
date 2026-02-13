'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  BookOpen,
  Building2,
  Calendar,
  Download,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { statisticsApi, schedulerApi } from '@/lib/api';
import { styles } from '@/lib/design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/skeleton';
import { getEntityColors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import type { Statistics, SchedulerStatus } from '@/types';

export default function ReportsPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, statusData] = await Promise.all([
          statisticsApi.get(),
          schedulerApi.getStatus(),
        ]);
        setStats(statsData);
        setSchedulerStatus(statusData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const totalResources = (stats?.teacherCount || 0) + (stats?.courseCount || 0) + (stats?.classroomCount || 0);

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Raporlar"
        description="Sistem istatistikleri ve raporları"
        icon={BarChart3}
        entity="reports"
        action={
          <Button className={styles.buttonPrimary}>
            <Download className="mr-2 h-4 w-4" />
            Rapor İndir
          </Button>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="schedule">Program Analizi</TabsTrigger>
          <TabsTrigger value="resources">Kaynak Kullanımı</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Öğretim Elemanı</CardTitle>
                <Users className={cn('h-4 w-4', getEntityColors('teachers').icon)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.teacherCount || 0}</div>
                <p className="text-xs text-muted-foreground">Aktif öğretim elemanı sayısı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Ders</CardTitle>
                <BookOpen className={cn('h-4 w-4', getEntityColors('courses').icon)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.courseCount || 0}</div>
                <p className="text-xs text-muted-foreground">Aktif ders sayısı</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Toplam Derslik</CardTitle>
                <Building2 className={cn('h-4 w-4', getEntityColors('classrooms').icon)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.classroomCount || 0}</div>
                <p className="text-xs text-muted-foreground">Kullanılabilir derslik</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Program Kayıtları</CardTitle>
                <Calendar className={cn('h-4 w-4', getEntityColors('schedules').icon)} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.scheduleCount || 0}</div>
                <p className="text-xs text-muted-foreground">Toplam program kaydı</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Kaynak Dağılımı
                </CardTitle>
                <CardDescription>Sistemdeki kaynakların dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={cn('h-3 w-3 rounded-full', getEntityColors('teachers').dot)} />
                        Öğretim Elemanları
                      </span>
                      <span>{stats?.teacherCount || 0}</span>
                    </div>
                    <Progress 
                      value={totalResources > 0 ? ((stats?.teacherCount || 0) / totalResources) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={cn('h-3 w-3 rounded-full', getEntityColors('courses').dot)} />
                        Dersler
                      </span>
                      <span>{stats?.courseCount || 0}</span>
                    </div>
                    <Progress 
                      value={totalResources > 0 ? ((stats?.courseCount || 0) / totalResources) * 100 : 0} 
                      className="h-2"
                      variant="success"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <div className={cn('h-3 w-3 rounded-full', getEntityColors('classrooms').dot)} />
                        Derslikler
                      </span>
                      <span>{stats?.classroomCount || 0}</span>
                    </div>
                    <Progress 
                      value={totalResources > 0 ? ((stats?.classroomCount || 0) / totalResources) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sistem Durumu
                </CardTitle>
                <CardDescription>Genel sistem performansı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Veritabanı Durumu</span>
                    <Badge variant="success">Aktif</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Durumu</span>
                    <Badge variant="success">Çalışıyor</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Son Güncelleme</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date().toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Program Tamamlanma Durumu</CardTitle>
                <CardDescription>Ders programı oluşturma istatistikleri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tamamlanma Oranı</span>
                    <span className="font-medium">{schedulerStatus?.completion_percentage || 0}%</span>
                  </div>
                  <Progress value={schedulerStatus?.completion_percentage || 0} />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className={cn('text-2xl font-bold', getEntityColors('courses').text)}>
                      {schedulerStatus?.scheduled_sessions || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Programlanan</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <p className={cn('text-2xl font-bold', getEntityColors('schedules').text)}>
                      {(schedulerStatus?.total_active_sessions || 0) - (schedulerStatus?.scheduled_sessions || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Bekleyen</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Oturum Detayları</CardTitle>
                <CardDescription>Aktif ders oturumları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Aktif Dersler</p>
                        <p className="text-xs text-muted-foreground">Programlanabilir dersler</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{schedulerStatus?.total_active_courses || 0}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Toplam Oturum</p>
                        <p className="text-xs text-muted-foreground">Teorik + Lab oturumları</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold">{schedulerStatus?.total_active_sessions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warnings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Uyarılar ve Öneriler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(schedulerStatus?.completion_percentage || 0) < 100 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Program Tamamlanmadı</p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Bazı dersler henüz programlanmadı. Program oluşturucuyu çalıştırarak tamamlayabilirsiniz.
                      </p>
                    </div>
                  </div>
                )}
                
                {(stats?.classroomCount || 0) < (stats?.courseCount || 0) && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <Building2 className={cn('h-5 w-5 mt-0.5', getEntityColors('classrooms').icon)} />
                    <div>
                      <p className="font-medium text-orange-800 dark:text-orange-200">Derslik Yetersizliği</p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Derslik sayısı ders sayısından az. Bu durum çakışmalara neden olabilir.
                      </p>
                    </div>
                  </div>
                )}

                {(schedulerStatus?.completion_percentage || 0) === 100 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <TrendingUp className={cn('h-5 w-5 mt-0.5', getEntityColors('courses').icon)} />
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-200">Tüm Dersler Programlandı</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Ders programı başarıyla tamamlandı. Tüm oturumlar yerleştirildi.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className={cn('h-5 w-5', getEntityColors('teachers').icon)} />
                  Öğretim Elemanı Analizi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className={cn('text-4xl font-bold', getEntityColors('teachers').text)}>{stats?.teacherCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Toplam Öğretim Elemanı</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ortalama Ders/Öğretim Elemanı</span>
                    <span className="font-medium">
                      {stats?.teacherCount ? ((stats?.courseCount || 0) / stats.teacherCount).toFixed(1) : 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className={cn('h-5 w-5', getEntityColors('courses').icon)} />
                  Ders Analizi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className={cn('text-4xl font-bold', getEntityColors('courses').text)}>{stats?.courseCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Toplam Ders</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aktif Oturum</span>
                    <span className="font-medium">{schedulerStatus?.total_active_sessions || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className={cn('h-5 w-5', getEntityColors('classrooms').icon)} />
                  Derslik Analizi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className={cn('text-4xl font-bold', getEntityColors('classrooms').text)}>{stats?.classroomCount || 0}</p>
                  <p className="text-sm text-muted-foreground">Toplam Derslik</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kullanım Oranı</span>
                    <span className="font-medium">
                      {stats?.classroomCount && stats?.scheduleCount 
                        ? Math.min(100, Math.round((stats.scheduleCount / (stats.classroomCount * 40)) * 100))
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
