'use client';

import { LucideIcon, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { styles, getStatusColors, StatusKey } from '@/lib/design-tokens';

interface Activity {
  id?: string | number;
  title: string;
  description?: string;
  time: string;
  status?: StatusKey;
  icon?: LucideIcon;
}

interface ActivityListProps {
  title?: string;
  activities: Activity[];
  className?: string;
}

export function ActivityList({
  title = 'Son Aktiviteler',
  activities,
  className,
}: ActivityListProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className={cn(styles.iconContainer, 'bg-primary/10')}>
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const statusColors = activity.status ? getStatusColors(activity.status) : null;
            const Icon = activity.icon;
            
            return (
              <div 
                key={activity.id || index} 
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                {Icon && (
                  <div className={cn(
                    'p-2 rounded-lg',
                    statusColors?.bg || 'bg-muted',
                    statusColors?.text || 'text-muted-foreground'
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
