'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { statisticsApi, schedulerApi } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { styles } from '@/lib/design-tokens';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeroSection } from '@/components/ui/hero-section';
import { OnboardingWizard } from '@/components/dashboard/onboarding-wizard';
import type { Statistics, SchedulerStatus } from '@/types';

// Import new widgets
import {
  StatisticsWidget,
  ScheduleStatusWidget,
  ActivityWidget,
  QuickActionsWidget,
  SystemHealthWidget,
  UpcomingEventsWidget,
} from '@/components/dashboard/widgets';

// Mock activity data
const recentActivities = [
  {
    id: '1',
    title: 'Yeni ders eklendi',
    description: 'Veri Yapıları dersi sisteme eklendi',
    timestamp: '2 dk önce',
    type: 'success' as const,
  },
  {
    id: '2',
    title: 'Program güncellendi',
    description: 'Pazartesi programında değişiklik yapıldı',
    timestamp: '15 dk önce',
    type: 'info' as const,
  },
  {
    id: '3',
    title: 'Çakışma tespit edildi',
    description: 'BIL101 ve BIL102 dersleri arasında zaman çakışması',
    timestamp: '1 saat önce',
    type: 'warning' as const,
  },
  {
    id: '4',
    title: 'Öğretmen eklendi',
    description: 'Dr. Ayşe Yılmaz sisteme kaydedildi',
    timestamp: '3 saat önce',
    type: 'success' as const,
  },
  {
    id: '5',
    title: 'Derslik güncellendi',
    description: 'A-101 derslik kapasitesi 50 olarak değiştirildi',
    timestamp: '5 saat önce',
    type: 'info' as const,
  },
];

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<Statistics>({
    teacherCount: 0,
    courseCount: 0,
    classroomCount: 0,
    scheduleCount: 0,
  });
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Prepare statistics for widget
  const statisticsData = [
    {
      label: 'Öğretmenler',
      value: stats.teacherCount,
      change: 5, // Mock trend data
      entity: 'teachers' as const,
      href: '/teachers',
    },
    {
      label: 'Dersler',
      value: stats.courseCount,
      change: 12,
      entity: 'courses' as const,
      href: '/courses',
    },
    {
      label: 'Derslikler',
      value: stats.classroomCount,
      change: 0,
      entity: 'classrooms' as const,
      href: '/classrooms',
    },
    {
      label: 'Programlar',
      value: stats.scheduleCount,
      change: 8,
      entity: 'schedules' as const,
      href: '/programs',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-muted/20 rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 bg-muted/20 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.pageContainer, 'pb-12')}>
      {/* Hero Section */}
      <HeroSection
        title={`${getGreeting()}, ${user?.username}!`}
        description="Ders programı yönetim sisteminize hoş geldiniz. İşte bugünkü özetiniz."
        badge={
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            PlanEdu v3.0
          </span>
        }
        action={
          isAdmin ? (
            <Link href="/scheduler">
              <Button size="lg" className="gap-2 shadow-md hover:shadow-lg">
                <Play className="h-5 w-5 fill-current" />
                Program Oluştur
              </Button>
            </Link>
          ) : undefined
        }
        className="shadow-lg shadow-primary/10 mb-12"
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard stats={stats} className="mb-12" />

      {/* Widgets Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2 columns width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <StatisticsWidget stats={statisticsData} />

          {/* Schedule Status */}
          <ScheduleStatusWidget schedulerStatus={schedulerStatus} isAdmin={isAdmin} />

          {/* Upcoming Events */}
          <UpcomingEventsWidget />
        </div>

        {/* Right Column - 1 column width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          {isAdmin && <QuickActionsWidget />}

          {/* Recent Activity */}
          <ActivityWidget activities={recentActivities} maxItems={5} />

          {/* System Health */}
          <SystemHealthWidget isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}
