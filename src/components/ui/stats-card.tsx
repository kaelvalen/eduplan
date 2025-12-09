import Link from 'next/link';
import { LucideIcon, TrendingUp, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { styles, getEntityColors, EntityKey } from '@/lib/design-tokens';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  entity?: EntityKey;
  href?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  entity,
  href,
  className,
}: StatsCardProps) {
  const entityColors = entity ? getEntityColors(entity) : null;
  
  const content = (
    <Card className={cn(styles.statCard, className)}>
      {/* Hover overlay with gradient */}
      {entityColors && (
        <div className={cn(
          styles.statCardOverlay,
          `bg-gradient-to-br ${entityColors.gradient}`
        )} />
      )}
      
      <CardContent className={styles.statCardContent}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground group-hover:text-white/80 transition-colors">
              {title}
            </p>
            <p className="text-4xl font-bold mt-2 group-hover:text-white transition-colors">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={cn(
              styles.iconContainer,
              entityColors?.bg || 'bg-primary/10',
              'group-hover:bg-white/20 transition-colors'
            )}>
              <Icon className={cn(
                'h-6 w-6',
                entityColors?.icon || 'text-primary',
                'group-hover:text-white transition-colors'
              )} />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center text-sm text-muted-foreground group-hover:text-white/70 transition-colors">
          <TrendingUp className="h-4 w-4 mr-1" />
          <span>{description || 'Bu ay aktif'}</span>
          {href && (
            <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
