import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody } from './widget-container';
import { getEntityColors } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatItem {
  label: string;
  value: number;
  change?: number;
  entity: 'teachers' | 'courses' | 'classrooms' | 'schedules';
  href: string;
}

interface StatisticsWidgetProps {
  stats: StatItem[];
}

export function StatisticsWidget({ stats }: StatisticsWidgetProps) {
  const getTrendIcon = (change?: number) => {
    if (!change || change === 0) return Minus;
    return change > 0 ? TrendingUp : TrendingDown;
  };

  const getTrendColor = (change?: number) => {
    if (!change || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400';
  };

  return (
    <WidgetContainer>
      <WidgetHeader
        title="Genel İstatistikler"
        subtitle="Sistemdeki kayıtların özeti"
        icon={BarChart3}
        iconColor="bg-primary/10 text-primary"
      />
      <WidgetBody>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => {
            const entityColors = getEntityColors(stat.entity);
            const TrendIcon = getTrendIcon(stat.change);

            return (
              <Link
                key={stat.entity}
                href={stat.href}
                className="group"
              >
                <div className={cn(
                  'p-4 rounded-xl border border-border/40 transition-all duration-200',
                  'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
                  'bg-gradient-to-br from-card to-muted/10'
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                      'text-xs font-medium uppercase tracking-wider',
                      entityColors.text
                    )}>
                      {stat.label}
                    </span>
                    {stat.change !== undefined && (
                      <div className={cn(
                        'flex items-center gap-1 text-xs font-medium',
                        getTrendColor(stat.change)
                      )}>
                        <TrendIcon className="h-3 w-3" />
                        <span>{Math.abs(stat.change)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      entityColors.dot
                    )} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </WidgetBody>
    </WidgetContainer>
  );
}
