'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from '@/lib/design-tokens';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
  className?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  badge,
  action,
  className,
}: HeroSectionProps) {
  return (
    <div className={cn(styles.hero, className)}>
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className={cn(styles.heroContent, 'flex flex-col md:flex-row md:items-center md:justify-between gap-6')}>
        <div>
          {badge && (
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium text-white/80">{badge}</span>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-white/90 mb-1">{subtitle}</p>
          )}
          {description && (
            <p className="text-white/80 max-w-md">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
