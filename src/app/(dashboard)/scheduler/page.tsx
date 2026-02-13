'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Play, CheckCircle, XCircle, AlertCircle, Cog,
  ChevronDown, ChevronRight, Info, Clock, Users, BookOpen,
  AlertTriangle, XOctagon, CalendarX, Building,
  Calendar, ExternalLink, LayoutGrid
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { schedulerApi } from '@/lib/api';
import { scheduleKeys } from '@/hooks/use-schedules';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type {
  SchedulerStatus,
  SchedulerResult,
  CourseFailureDiagnostic,
  SessionFailureDiagnostic,
  DayAttemptDiagnostic,
  TimeSlotAttemptDiagnostic
} from '@/types';

/**
 * Get color and icon for failure reason type
 */
function getFailureTypeStyle(type: string) {
  switch (type) {
    case 'teacher_unavailable':
      return {
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-200 dark:border-orange-800',
        icon: Clock
      };
    case 'teacher_conflict':
      return {
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-200 dark:border-red-800',
        icon: XOctagon
      };
    case 'department_conflict':
      return {
        color: 'text-purple-600 dark:text-purple-400',
        bg: 'bg-purple-50 dark:bg-purple-950/30',
        border: 'border-purple-200 dark:border-purple-800',
        icon: Users
      };
    case 'no_classroom':
      return {
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-200 dark:border-blue-800',
        icon: Building
      };
    case 'insufficient_blocks':
      return {
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        icon: CalendarX
      };
    default:
      return {
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-950/30',
        border: 'border-gray-200 dark:border-gray-800',
        icon: AlertTriangle
      };
  }
}

/**
 * Time slot attempt display component
 */
function TimeSlotAttempt({ attempt }: { attempt: TimeSlotAttemptDiagnostic }) {
  const style = getFailureTypeStyle(attempt.failureReason.type);
  const IconComponent = style.icon;

  return (
    <div className={cn('rounded-lg p-3 border', style.bg, style.border)}>
      <div className="flex items-start gap-2">
        <IconComponent className={cn('h-4 w-4 mt-0.5', style.color)} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{attempt.timeRange}</span>
            <Badge variant="outline" className="text-xs">
              {attempt.failureReason.type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className={cn('text-sm', style.color)}>
            {attempt.failureReason.message}
          </p>

          {/* Show details if available */}
          {attempt.failureReason.details && (
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {attempt.failureReason.details.requiredCapacity && (
                <div>Gerekli kapasite: {attempt.failureReason.details.requiredCapacity}</div>
              )}
              {attempt.failureReason.details.availableClassrooms !== undefined && (
                <div>Uygun derslik sayısı: {attempt.failureReason.details.availableClassrooms}</div>
              )}
              {attempt.failureReason.details.requiredType && (
                <div>Gerekli tip: {attempt.failureReason.details.requiredType}</div>
              )}
              {attempt.failureReason.details.teacherAvailableHours && (
                <div>
                  Öğretmen müsait saatler: {attempt.failureReason.details.teacherAvailableHours.join(', ') || 'Belirsiz'}
                </div>
              )}
              {attempt.failureReason.details.conflictingCourses && attempt.failureReason.details.conflictingCourses.length > 0 && (
                <div>
                  <div className="font-medium mb-1">Çakışan dersler:</div>
                  <ul className="list-disc list-inside ml-2">
                    {attempt.failureReason.details.conflictingCourses.map((c, i) => (
                      <li key={i}>{c.code} - {c.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {attempt.failureReason.details.conflictingDepartments && attempt.failureReason.details.conflictingDepartments.length > 0 && (
                <div>
                  Çakışan bölümler: {attempt.failureReason.details.conflictingDepartments.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Day attempt section component
 */
function DayAttemptSection({ dayAttempt }: { dayAttempt: DayAttemptDiagnostic }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer">
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          <span className="font-medium text-sm">{dayAttempt.day}</span>
          <Badge variant="secondary" className="text-xs">
            {dayAttempt.attemptedTimeSlots.length} deneme
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pt-2 space-y-2">
        {dayAttempt.attemptedTimeSlots.map((slot, idx) => (
          <TimeSlotAttempt key={idx} attempt={slot} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Session failure section component
 */
function SessionFailureSection({ session }: { session: SessionFailureDiagnostic }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{session.sessionType}</span>
          <Badge variant="outline">{session.sessionHours} saat</Badge>
          {session.splitAttempted && (
            <Badge variant={session.splitSucceeded ? "default" : "destructive"} className="text-xs">
              {session.splitSucceeded ? '✓ Bölündü' : '✗ Bölünemedi'}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          {isOpen ? 'Gizle' : 'Detayları Göster'}
        </Button>
      </div>

      <Collapsible open={isOpen}>
        <CollapsibleContent className="space-y-3 pt-2">
          <div className="text-sm text-muted-foreground">
            {session.attemptedDays.length} gün denendi, toplam{' '}
            {session.attemptedDays.reduce((sum, d) => sum + d.attemptedTimeSlots.length, 0)} zaman dilimi test edildi
          </div>

          {session.splitAttempted && (
            <div className={cn(
              'text-sm p-2 rounded',
              session.splitSucceeded
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
            )}>
              {session.splitSucceeded
                ? '✓ Oturum aynı gün içinde daha küçük parçalara bölünerek yerleştirildi'
                : '✗ Oturum bölünmeye çalışıldı ancak başarısız oldu'
              }
            </div>
          )}

          <div className="space-y-2">
            {session.attemptedDays.map((day, idx) => (
              <DayAttemptSection key={idx} dayAttempt={day} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Course failure card component
 */
function CourseFailureCard({ diagnostic }: { diagnostic: CourseFailureDiagnostic }) {
  const [isOpen, setIsOpen] = useState(false);

  const totalAttempts = diagnostic.failedSessions.reduce(
    (sum, session) => sum + session.attemptedDays.reduce(
      (daySum, day) => daySum + day.attemptedTimeSlots.length, 0
    ), 0
  );

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">{diagnostic.courseCode}</CardTitle>
            </div>
            <CardDescription className="text-base font-medium">
              {diagnostic.courseName}
            </CardDescription>
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {diagnostic.studentCount} öğrenci
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {diagnostic.totalHours} saat
              </div>
              <div>{diagnostic.faculty}</div>
              <div>{diagnostic.level} - {diagnostic.semester}</div>
            </div>
            {diagnostic.departments.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Bölümler: {diagnostic.departments.map(d => `${d.department} (${d.studentCount})`).join(', ')}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <ChevronDown className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 mr-2" />}
            {isOpen ? 'Detayları Gizle' : 'Detayları Göster'}
          </Button>
        </div>
      </CardHeader>

      <Collapsible open={isOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>
                {diagnostic.failedSessions.length} oturum programlanamadı • {totalAttempts} farklı zaman dilimi denendi
              </span>
            </div>

            <div className="space-y-3">
              {diagnostic.failedSessions.map((session, idx) => (
                <SessionFailureSection key={idx} session={session} />
              ))}
            </div>

            {/* Summary and suggestions */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Öneriler
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Öğretmen müsaitlik saatlerini kontrol edin ve genişletin</li>
                <li>Ek derslik tahsis etmeyi düşünün (özellikle {diagnostic.failedSessions.map(s => s.sessionType).join(', ')} için)</li>
                <li>Dersin toplam saatini azaltmayı veya farklı günlere yaymayı değerlendirin</li>
                <li>Benzer bölümlerdeki dersleri farklı saatlere kaydırın</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

type SchedulerContentProps = {
  status: SchedulerStatus | null;
  result: SchedulerResult | null;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
};

function SchedulerContent({ status, result, onGenerate, isGenerating }: SchedulerContentProps) {
  const [algorithmOpen, setAlgorithmOpen] = useState(false);
  const completion = status?.completion_percentage ?? 0;
  const hasSchedules = (status?.total_scheduled_hours ?? 0) > 0;

  return (
    <div className={styles.pageContainer}>
      <PageHeader
        title="Program Oluşturucu"
        description="Akıllı sezgisel algoritma ile otomatik ders programı oluşturun"
        icon={Cog}
        entity="scheduler"
      />

      {/* Hero: completion + quick view */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] mb-6">
        <Card className="overflow-hidden">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
            <div
              className={cn(
                'h-24 w-24 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0',
                completion === 100
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : completion >= 50
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {completion}%
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h3 className="font-semibold text-lg">Tamamlanma durumu</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {status?.total_scheduled_hours ?? 0} / {status?.total_required_hours ?? 0} saat programlandı
                ({status?.fully_scheduled_courses ?? 0}/{status?.total_active_courses ?? 0} ders tamamen yerleşti)
              </p>
              <Progress value={completion} className="mt-3 h-2 max-w-xs mx-auto sm:mx-0" />
            </div>
          </CardContent>
        </Card>

        {hasSchedules && (
          <Card className="lg:w-64 flex flex-col justify-center">
            <CardContent className="p-6">
              <LayoutGrid className="h-10 w-10 text-primary mb-2 opacity-80" />
              <p className="font-medium">Program hazır</p>
              <p className="text-sm text-muted-foreground mb-4">Bölüm ve sınıf bazlı görüntüleyin</p>
              <Button asChild variant="default" className="w-full gap-2">
                <Link href="/programs">
                  <Calendar className="h-4 w-4" />
                  Programı Görüntüle
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Aktif ders
            </CardDescription>
            <CardTitle className="text-2xl">{status?.total_active_courses ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Tamamen programlanan
            </CardDescription>
            <CardTitle className="text-2xl">
              {status?.fully_scheduled_courses ?? 0}
              <span className="text-base font-normal text-muted-foreground ml-1">
                / {status?.total_active_courses ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Programlanan saat
            </CardDescription>
            <CardTitle className="text-2xl">
              {status?.total_scheduled_hours ?? 0}
              <span className="text-base font-normal text-muted-foreground ml-1">
                / {status?.total_required_hours ?? 0}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tamamlanma</CardDescription>
            <CardTitle
              className={cn(
                'text-2xl',
                completion === 100
                  ? 'text-green-600 dark:text-green-400'
                  : completion >= 50
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
              )}
            >
              {completion}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Generate */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Program Oluştur</CardTitle>
          <CardDescription>
            Smart Greedy algoritması ile tüm aktif dersler için otomatik program oluşturur. Mevcut program silinir ve yenisi oluşturulur.
            Öğretmen müsaitlik saatleri <strong>Öğretmenler</strong> sayfasında her öğretmen için &quot;Çalışma saatleri&quot; bölümünden girilir; girilmezse o öğretmen tüm saatlerde müsait kabul edilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            onClick={onGenerate}
            disabled={isGenerating || (status?.total_active_courses ?? 0) === 0}
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
          {(status?.total_active_courses ?? 0) === 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              Programlanacak aktif ders bulunamadı.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <CardTitle>Sonuç</CardTitle>
                  <CardDescription>{result.message}</CardDescription>
                </div>
              </div>
              {result.success && result.scheduled_count > 0 && (
                <Button asChild variant="default" className="gap-2 shrink-0">
                  <Link href="/programs">
                    <ExternalLink className="h-4 w-4" />
                    Programı Görüntüle
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Programlanan oturum</p>
                <p className={cn('text-2xl font-bold', getStatusColors('success').text)}>{result.scheduled_count}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Programlanamayan</p>
                <p className={cn('text-2xl font-bold', getStatusColors('error').text)}>{result.unscheduled_count}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Başarı oranı</p>
                <p className="text-2xl font-bold">{result.success_rate}%</p>
              </div>
            </div>

            {/* Detailed failure diagnostics */}
            {result.diagnostics && result.diagnostics.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="text-lg font-semibold">
                    Detaylı Hata Analizi ({result.diagnostics.length} ders)
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Her ders için tüm denenen gün ve saat dilimleri, başarısızlık nedenleri ve öneriler aşağıda gösterilmiştir.
                  Detayları görmek için dersleri genişletin.
                </p>
                <div className="space-y-4">
                  {result.diagnostics.map((diagnostic) => (
                    <CourseFailureCard key={diagnostic.courseId} diagnostic={diagnostic} />
                  ))}
                </div>
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

      {/* Algorithm info (collapsible) */}
      <Collapsible open={algorithmOpen} onOpenChange={setAlgorithmOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Algoritma bilgisi
                </CardTitle>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', algorithmOpen && 'rotate-180')} />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-2 text-sm text-muted-foreground pt-0">
              <p>
                <strong>Smart Greedy</strong> ile program oluşturulur.
              </p>
              <p>Kısıtlar: öğretmen müsaitliği (Öğretmenler → düzenle → Çalışma saatleri), derslik kapasite/türü, bölüm/seviye çakışmaması, günlük max 8 saat, dersler arası min 30 dk ara, aynı dersin oturumları farklı günlerde.</p>
              <p className="mt-2">
                <strong>Gelişmiş:</strong> oturum bölme (2+2), teorik/lab aynı gün tercihi, backtracking, O(1) çakışma kontrolü.
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

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
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
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
  return (
    <SchedulerContent
      status={status}
      result={result}
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
    />
  );
}
