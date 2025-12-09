'use client';

import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { styles, getEntityColors, EntityKey } from '@/lib/design-tokens';

interface NavCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  entity?: EntityKey;
  className?: string;
}

export function NavCard({
  title,
  description,
  href,
  icon: Icon,
  entity,
  className,
}: NavCardProps) {
  const entityColors = entity ? getEntityColors(entity) : null;

  return (
    <Link href={href}>
      <Card className={cn(
        styles.card,
        styles.cardHover,
        'h-full',
        className
      )}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn(
              styles.iconContainer,
              entityColors?.bg || 'bg-primary/10'
            )}>
              <Icon className={cn(
                'h-6 w-6',
                entityColors?.icon || 'text-primary'
              )} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {description}
              </p>
              <div className="flex items-center text-sm text-primary font-medium">
                Görüntüle
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface NavCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function NavCardGrid({ 
  children, 
  columns = 2,
  className 
}: NavCardGridProps) {
  const colClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', colClasses[columns], className)}>
      {children}
    </div>
  );
}
