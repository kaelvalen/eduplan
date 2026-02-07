import * as React from 'react';
import { Activity, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody, WidgetFooter } from './widget-container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'success' | 'warning' | 'error' | 'info';
  icon?: LucideIcon;
}

interface ActivityWidgetProps {
  activities: ActivityItem[];
  maxItems?: number;
}

const activityConfig = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-rose-50 dark:bg-rose-950/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
  },
  info: {
    icon: Info,
    bgColor: 'bg-sky-50 dark:bg-sky-950/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
    dotColor: 'bg-sky-500',
  },
};

const ActivityWidgetComponent = ({ activities, maxItems = 5 }: ActivityWidgetProps) => {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <WidgetContainer>
      <WidgetHeader
        title="Son Aktiviteler"
        subtitle="Sistemdeki son değişiklikler"
        icon={Activity}
        iconColor="bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
      />
      <WidgetBody padding={false}>
        <div className="divide-y divide-border/30">
          {displayedActivities.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-muted/30 mb-3">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Henüz aktivite bulunmuyor
              </p>
            </div>
          ) : (
            displayedActivities.map((activity, index) => {
              const config = activityConfig[activity.type];
              const Icon = activity.icon || config.icon;

              return (
                <div
                  key={activity.id}
                  className="px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Timeline */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'p-2 rounded-lg',
                        config.bgColor
                      )}>
                        <Icon className={cn('h-4 w-4', config.iconColor)} />
                      </div>
                      {index < displayedActivities.length - 1 && (
                        <div className="flex-1 w-px bg-border/40 my-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h4 className="text-sm font-semibold text-foreground leading-tight">
                          {activity.title}
                        </h4>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {activity.timestamp}
                        </time>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </WidgetBody>
      {activities.length > maxItems && (
        <WidgetFooter>
          <Button variant="ghost" className="w-full justify-center text-sm">
            Tümünü Görüntüle ({activities.length} aktivite)
          </Button>
        </WidgetFooter>
      )}
    </WidgetContainer>
  );
};

export const ActivityWidget = React.memo(ActivityWidgetComponent);
