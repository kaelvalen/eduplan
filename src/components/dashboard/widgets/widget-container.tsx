import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface WidgetContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient';
}

export function WidgetContainer({
  children,
  className,
  variant = 'default',
  ...props
}: WidgetContainerProps) {
  return (
    <Card
      variant={variant === 'gradient' ? 'default' : variant}
      className={cn(
        'overflow-hidden transition-all duration-300',
        variant === 'gradient' && 'bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10',
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}

interface WidgetHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  action?: React.ReactNode;
  className?: string;
}

export function WidgetHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  action,
  className,
}: WidgetHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between p-6 pb-4', className)}>
      <div className="flex items-start gap-3 flex-1">
        {Icon && (
          <div className={cn(
            'p-2.5 rounded-xl',
            iconColor || 'bg-primary/10 text-primary'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground leading-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

interface WidgetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: boolean;
}

export function WidgetBody({
  children,
  padding = true,
  className,
  ...props
}: WidgetBodyProps) {
  return (
    <div
      className={cn(
        padding && 'px-6 pb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface WidgetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function WidgetFooter({ children, className, ...props }: WidgetFooterProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-border/40 bg-muted/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
