'use client';

import { LucideIcon, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { styles, getEntityColors, EntityKey } from '@/lib/design-tokens';

interface StatusMetric {
  label: string;
  value: number | string;
  entity?: EntityKey;
}

interface StatusSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  progress?: number;
  isComplete?: boolean;
  metrics?: StatusMetric[];
  className?: string;
}

export function StatusSection({
  title,
  description,
  icon: Icon = Activity,
  progress,
  isComplete,
  metrics,
  className,
}: StatusSectionProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(styles.iconContainer, 'bg-primary/10')}>
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
          </div>
          {progress !== undefined && (
            <Badge 
              variant={isComplete ? 'success' : 'secondary'}
              className="px-3 py-1"
            >
              {isComplete ? '✓ Tamamlandı' : '⏳ Devam Ediyor'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {progress !== undefined && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tamamlanma Oranı</span>
              <span className="font-bold text-lg">{progress}%</span>
            </div>
            <Progress 
              value={progress} 
              variant={isComplete ? 'success' : 'default'}
              className="h-3"
            />
          </div>
        )}
        
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {metrics.map((metric, index) => {
              const entityColors = metric.entity ? getEntityColors(metric.entity) : null;
              return (
                <div 
                  key={index} 
                  className={cn(
                    'text-center p-4 rounded-xl',
                    entityColors?.bg || 'bg-muted/50'
                  )}
                >
                  <p className={cn(
                    'text-3xl font-bold',
                    entityColors?.text || 'text-foreground'
                  )}>
                    {metric.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
