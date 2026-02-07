import * as React from 'react';
import { Calendar, CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody, WidgetFooter } from './widget-container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ScheduleStatusWidgetProps {
  schedulerStatus: {
    completion_percentage: number;
    total_active_courses: number;
    total_active_sessions: number;
    scheduled_sessions: number;
    conflicts?: number;
  } | null;
  isAdmin: boolean;
}

const ScheduleStatusWidgetComponent = ({ schedulerStatus, isAdmin }: ScheduleStatusWidgetProps) => {
  if (!schedulerStatus) {
    return (
      <WidgetContainer variant="gradient">
        <WidgetHeader
          title="Program Durumu"
          subtitle="Henüz program oluşturulmadı"
          icon={Calendar}
          iconColor="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
        />
        <WidgetBody>
          <div className="text-center py-8">
            <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-4">
              <Calendar className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Program oluşturmak için başlayın
            </p>
            {isAdmin && (
              <Link href="/scheduler">
                <Button variant="default" className="gap-2">
                  <Play className="h-4 w-4" />
                  Program Oluştur
                </Button>
              </Link>
            )}
          </div>
        </WidgetBody>
      </WidgetContainer>
    );
  }

  const { completion_percentage, total_active_courses, total_active_sessions, scheduled_sessions, conflicts = 0 } = schedulerStatus;
  const isComplete = completion_percentage === 100;
  const hasConflicts = conflicts > 0;

  return (
    <WidgetContainer>
      <WidgetHeader
        title="Program Durumu"
        subtitle={isComplete ? 'Program tamamlandı' : 'Program oluşturuluyor'}
        icon={Calendar}
        iconColor={cn(
          'text-white',
          isComplete ? 'bg-emerald-500' : 'bg-amber-500'
        )}
        action={
          <Badge variant={isComplete ? 'success' : 'warning'}>
            {isComplete ? 'Tamamlandı' : 'Devam ediyor'}
          </Badge>
        }
      />

      <WidgetBody>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Tamamlanma</span>
            <span className="text-sm font-bold text-primary">{completion_percentage}%</span>
          </div>
          <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isComplete ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${completion_percentage}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50">
            <div className="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1">
              Aktif Dersler
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {total_active_courses}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mb-1">
              Toplam Oturum
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {total_active_sessions}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/50">
            <div className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">
              Programlanan
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {scheduled_sessions}
            </div>
          </div>

          <div className={cn(
            'p-3 rounded-lg border',
            hasConflicts
              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
              : 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/50'
          )}>
            <div className={cn(
              'text-xs font-medium mb-1',
              hasConflicts
                ? 'text-rose-700 dark:text-rose-300'
                : 'text-slate-700 dark:text-slate-300'
            )}>
              Çakışma
            </div>
            <div className={cn(
              'text-2xl font-bold',
              hasConflicts
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-600 dark:text-slate-400'
            )}>
              {conflicts}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {hasConflicts && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-rose-700 dark:text-rose-300">
                Programda {conflicts} çakışma tespit edildi. İncelemeniz gerekiyor.
              </p>
            </div>
          </div>
        )}
      </WidgetBody>

      {isAdmin && (
        <WidgetFooter>
          <Link href="/scheduler" className="block">
            <Button variant="ghost" className="w-full justify-between group">
              <span>Program Yönetimi</span>
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                Detaylı görünüm →
              </span>
            </Button>
          </Link>
        </WidgetFooter>
      )}
    </WidgetContainer>
  );
};

export const ScheduleStatusWidget = React.memo(ScheduleStatusWidgetComponent);
