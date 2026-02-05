'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, BookOpen, Building2, Calendar, Zap, Play, CheckCircle2, Activity, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { statisticsApi, schedulerApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useDashboardPreferences } from '@/hooks/use-dashboard-preferences';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { HeroSection } from '@/components/ui/hero-section';
import { StatsCard } from '@/components/ui/stats-card';
import { ActionCard, ActionCardGrid } from '@/components/ui/action-card';
import { NavCard, NavCardGrid } from '@/components/ui/nav-card';
import { ActivityList } from '@/components/ui/activity-list';
import { StatusSection } from '@/components/ui/status-section';
import { TipCard, KeyboardShortcut } from '@/components/ui/tip-card';
import { DashboardGrid } from '@/components/ui/dashboard-grid';
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard';
import type { Statistics, SchedulerStatus, WidgetConfig } from '@/types';
import { getEntityColors, type EntityKey, type StatusKey } from '@/lib/design-tokens';

// Stat cards configuration using entity keys
const statCardsConfig = [
  { title: 'Öğretmenler', key: 'teacherCount' as const, icon: Users, href: '/teachers', entity: 'teachers' as EntityKey },
  { title: 'Dersler', key: 'courseCount' as const, icon: BookOpen, href: '/courses', entity: 'courses' as EntityKey },
  { title: 'Derslikler', key: 'classroomCount' as const, icon: Building2, href: '/classrooms', entity: 'classrooms' as EntityKey },
  { title: 'Programlar', key: 'scheduleCount' as const, icon: Calendar, href: '/programs', entity: 'schedules' as EntityKey },
];

// Quick actions configuration
const quickActionsConfig = [
  { label: 'Öğretmen Ekle', href: '/teachers/new', icon: Users, entity: 'teachers' as EntityKey },
  { label: 'Ders Ekle', href: '/courses/new', icon: BookOpen, entity: 'courses' as EntityKey },
  { label: 'Derslik Ekle', href: '/classrooms/new', icon: Building2, entity: 'classrooms' as EntityKey },
  { label: 'Program Oluştur', href: '/scheduler', icon: Zap, entity: 'scheduler' as EntityKey },
];

// Recent activities (would come from API in real app)
const recentActivitiesData = [
  { title: 'Yeni ders eklendi', description: 'Veri Yapıları', time: '2 dk önce', status: 'success' as StatusKey, icon: CheckCircle2 },
  { title: 'Program güncellendi', description: 'Pazartesi', time: '15 dk önce', status: 'info' as StatusKey, icon: Activity },
  { title: 'Çakışma tespit edildi', description: 'BIL101 - BIL102', time: '1 saat önce', status: 'warning' as StatusKey, icon: AlertTriangle },
  { title: 'Öğretmen eklendi', description: 'Dr. Ayşe Yılmaz', time: '3 saat önce', status: 'success' as StatusKey, icon: CheckCircle2 },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { widgets, layout, updateWidgets, updateLayout } = useDashboardPreferences();
  const [stats, setStats] = useState<Statistics>({
    teacherCount: 0,
    courseCount: 0,
    classroomCount: 0,
    scheduleCount: 0,
  });
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, statusData] = await Promise.all([
          statisticsApi.get(),
          isAdmin ? schedulerApi.getStatus() : Promise.resolve(null),
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

    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-48 w-full bg-muted/20 rounded-2xl" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Render widget content based on type
  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'stats':
        return (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {statCardsConfig.map((stat, i) => (
              <StatsCard
                key={stat.key}
                title={stat.title}
                value={stats[stat.key]}
                icon={stat.icon}
                entity={stat.entity}
                href={stat.href}
                className="h-full"
              />
            ))}
          </div>
        );

      case 'actions':
        if (!isAdmin) return null;
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(styles.iconContainer, getEntityColors('scheduler').bg, "shadow-md")}>
                <Zap className={cn('h-4 w-4', getEntityColors('scheduler').icon)} />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Hızlı İşlemler</h4>
                <p className="text-xs text-muted-foreground">Sık kullanılan işlemlere hızlı erişim</p>
              </div>
            </div>
            <div className="flex-1">
              <ActionCardGrid>
                {quickActionsConfig.map((action) => (
                  <ActionCard
                    key={action.label}
                    label={action.label}
                    href={action.href}
                    icon={action.icon}
                    entity={action.entity}
                  />
                ))}
              </ActionCardGrid>
            </div>
          </div>
        );

      case 'activity':
        return <ActivityList activities={recentActivitiesData} />;

      case 'scheduler':
        if (!isAdmin || !schedulerStatus) return null;
        return (
          <StatusSection
            title=""
            description=""
            icon={Activity}
            progress={schedulerStatus.completion_percentage}
            isComplete={schedulerStatus.completion_percentage === 100}
            metrics={[
              { label: 'Aktif Ders', value: schedulerStatus.total_active_courses, entity: 'teachers' },
              { label: 'Toplam Oturum', value: schedulerStatus.total_active_sessions, entity: 'courses' },
              { label: 'Programlanan', value: schedulerStatus.scheduled_sessions, entity: 'classrooms' },
            ]}
          />
        );

      case 'navigation':
        return (
          <NavCardGrid>
            {statCardsConfig.map((stat) => (
              <NavCard
                key={stat.key}
                title={stat.title}
                description={`${stat.title} bilgilerini görüntüle ve yönet`}
                href={stat.href}
                icon={stat.icon}
                entity={stat.entity}
              />
            ))}
          </NavCardGrid>
        );

      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground">Widget yükleniyor...</div>;
    }
  };

  return (
    <div className={cn(styles.pageContainer, "pb-12")}>
      {/* Hero Section - Always visible */}
      <HeroSection
        title={`${getGreeting()}, ${user?.username}!`}
        description="Ders programı yönetim sisteminize hoş geldiniz. İşte bugünkü özetiniz."
        badge="PlanEdu v3.0"
        action={isAdmin ? (
          <Link href="/scheduler">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl hover:-translate-y-0.5 transition-transform duration-300 font-bold border-0">
              <Play className="mr-2 h-5 w-5 fill-current" />
              Program Oluştur
            </Button>
          </Link>
        ) : undefined}
        className="shadow-2xl shadow-primary/20 mb-8"
      />

      {/* Onboarding Wizard - Shows only if setup is incomplete */}
      <OnboardingWizard stats={stats} className="mb-8" />

      {/* Dashboard Grid */}
      <DashboardGrid
        widgets={widgets}
        layout={layout}
        onWidgetsChange={updateWidgets}
        onLayoutChange={updateLayout}
        isEditMode={isEditMode}
        onEditModeChange={setIsEditMode}
        renderWidget={renderWidgetContent}
      />

      {/* Tips Card - Always visible outside grid */}
      {!isEditMode && (
        <div className="mt-6">
          <TipCard>
            <p className="text-sm text-muted-foreground">
              Klavye kısayollarını kullanarak daha hızlı gezinebilirsiniz.
            </p>
            <KeyboardShortcut keys={['⌘', 'K']} description="Hızlı arama" />
          </TipCard>
        </div>
      )}
    </div>
  );
}
