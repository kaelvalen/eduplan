'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Play, CheckCircle, XCircle, AlertCircle, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { schedulerApi } from '@/lib/api';
import { scheduleKeys } from '@/hooks/use-schedules';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/skeleton';
import { getStatusColors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { SchedulerStatus, SchedulerResult } from '@/types';

export default function SchedulerPage() {
  const { isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }
    fetchStatus();
  }, [isAdmin, router]);

  const fetchStatus = async () => {
    try {
      const data = await schedulerApi.getStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching status:', error);
      toast.error('Durum bilgisi alınamadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const data = await schedulerApi.generate();
      setResult(data);
      await fetchStatus();
      
      // ✅ Invalidate schedules cache - programs page will auto-update!
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      console.log('✅ Schedules cache invalidated - programs page will refresh!');
      
      if (data.success) {
        toast.success(data.message + ' - Programlar sayfası otomatik güncellenecek!');
        if (data.lunch_overflow_warnings && data.lunch_overflow_warnings.length > 0) {
          toast.warning(
            `${data.lunch_overflow_warnings.length} oturum öğle arasına taşıyor. Ayrıntılar sonuç bölümünde.`
          );
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Program oluşturulurken bir hata oluştu';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
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
        title="Program Oluşturucu"
        description="Genetik algoritma ile otomatik ders programı oluşturun"
        icon={Cog}
        entity="scheduler"
      />

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktif Ders</CardDescription>
            <CardTitle className="text-2xl">{status?.total_active_courses || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam Oturum</CardDescription>
            <CardTitle className="text-2xl">{status?.total_active_sessions || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Programlanan</CardDescription>
            <CardTitle className="text-2xl">{status?.scheduled_sessions || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tamamlanma</CardDescription>
            <CardTitle className="text-2xl">{status?.completion_percentage || 0}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Generate Button */}
      <Card>
        <CardHeader>
          <CardTitle>Program Oluştur</CardTitle>
          <CardDescription>
            Genetik algoritma kullanarak tüm aktif dersler için otomatik program oluşturur.
            Mevcut program silinecek ve yeni program oluşturulacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || (status?.total_active_courses || 0) === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Program Oluşturuluyor...
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Program Oluştur
              </>
            )}
          </Button>
          {(status?.total_active_courses || 0) === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Programlanacak aktif ders bulunamadı.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <CardTitle>Sonuç</CardTitle>
            </div>
            <CardDescription>{result.message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Programlanan</p>
                <p className={cn('text-2xl font-bold', getStatusColors('success').text)}>{result.scheduled_count}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Programlanamayan</p>
                <p className={cn('text-2xl font-bold', getStatusColors('error').text)}>{result.unscheduled_count}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">Başarı Oranı</p>
                <p className="text-2xl font-bold">{result.success_rate}%</p>
              </div>
            </div>

            {result.unscheduled && result.unscheduled.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Programlanamayan Dersler
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ders Kodu</TableHead>
                      <TableHead>Ders Adı</TableHead>
                      <TableHead>Saat</TableHead>
                      <TableHead>Öğrenci</TableHead>
                      <TableHead>Sebep</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.unscheduled.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.code}</TableCell>
                        <TableCell>{course.name}</TableCell>
                        <TableCell>{course.total_hours}</TableCell>
                        <TableCell>{course.student_count}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {course.reason}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {result.lunch_overflow_warnings && result.lunch_overflow_warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
                <h4 className="mb-2 flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-200">
                  <AlertCircle className="h-4 w-4" />
                  Öğle arasına taşma uyarısı
                </h4>
                <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">
                  Aşağıdaki oturumlar öğle arasına taşıyor. Yerleştirme yapıldı; gerekirse manuel düzenleyin.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ders Kodu</TableHead>
                      <TableHead>Ders Adı</TableHead>
                      <TableHead>Gün</TableHead>
                      <TableHead>Saat Aralığı</TableHead>
                      <TableHead>Tür</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.lunch_overflow_warnings.map((w, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{w.courseCode}</TableCell>
                        <TableCell>{w.courseName}</TableCell>
                        <TableCell>{w.day}</TableCell>
                        <TableCell>{w.timeRange}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {w.sessionType}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Algoritma Bilgisi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Genetik Algoritma</strong> kullanılarak program oluşturulur.
          </p>
          <p>Dikkate alınan kısıtlar:</p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Öğretmen müsaitlik saatleri</li>
            <li>Derslik kapasitesi ve türü (teorik/lab)</li>
            <li>Aynı bölüm ve seviyedeki derslerin çakışmaması</li>
            <li>Günlük maksimum 8 saat ders</li>
            <li>Dersler arası minimum 30 dakika ara</li>
            <li>Aynı dersin oturumlarının farklı günlerde olması</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
