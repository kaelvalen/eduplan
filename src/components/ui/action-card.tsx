'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEntityColors, EntityKey } from '@/lib/design-tokens';

interface ActionCardProps {
  label: string;
  href: string;
  icon: LucideIcon;
  entity?: EntityKey;
  className?: string;
}

export function ActionCard({
  label,
  href,
  icon: Icon,
  entity,
  className,
}: ActionCardProps) {
  const entityColors = entity ? getEntityColors(entity) : null;

  return (
    <Link href={href}>
      <div className={cn(
        'group p-4 rounded-xl border-2 border-dashed border-border/50',
        'hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm transition-all cursor-pointer text-center',
        className
      )}>
        <div className={cn(
          'inline-flex p-3 rounded-xl mb-3',
          'group-hover:scale-105 transition-transform shadow-sm',
          entityColors ? `bg-gradient-to-br ${entityColors.gradient} text-white` : 'bg-primary/80 text-white'
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium">{label}</p>
      </div>
    </Link>
  );
}

interface ActionCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ActionCardGrid({ 
  children, 
  columns = 4,
  className 
}: ActionCardGridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-3', colClasses[columns], className)}>
      {children}
    </div>
  );
}
