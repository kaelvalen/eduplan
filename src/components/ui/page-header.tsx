'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles, getEntityColors, EntityKey } from '@/lib/design-tokens';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  entity?: EntityKey;
  count?: number;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  entity,
  count,
  action,
  className,
}: PageHeaderProps) {
  const entityColors = entity ? getEntityColors(entity) : null;

  return (
    <div className={cn(styles.pageHeader, "animate-fade-in", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn(
            "p-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-sm",
            entityColors?.bg || 'bg-primary/10'
          )}>
            <Icon className={cn(
              'h-8 w-8',
              entityColors?.text || 'text-primary'
            )} />
          </div>
        )}
        <div>
          <h1 className={cn(styles.pageHeaderTitle, "tracking-tight text-foreground")}>{title}</h1>
          <p className={cn(styles.pageHeaderDescription, "text-muted-foreground/80")}>
            {description || (count !== undefined ? `${count} kayıt` : '')}
          </p>
        </div>
      </div>
      {action && <div className="flex-shrink-0 animate-scale-in">{action}</div>}
    </div>
  );
}
