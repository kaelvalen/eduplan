'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { styles } from '@/lib/design-tokens';

interface TipCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function TipCard({
  title = 'Pro İpucu',
  children,
  className,
}: TipCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-2 bg-gradient-to-r from-primary via-violet-500 to-pink-500" />
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={cn(styles.iconContainer, 'bg-primary/10')}>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold mb-2">{title}</h3>
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

export function KeyboardShortcut({ keys, description }: KeyboardShortcutProps) {
  return (
    <div className="flex items-center gap-2 mt-3">
      {keys.map((key, index) => (
        <span key={index} className="contents">
          <kbd className="px-2 py-1 text-xs bg-muted rounded-md font-mono">{key}</kbd>
          {index < keys.length - 1 && (
            <span className="text-xs text-muted-foreground">+</span>
          )}
        </span>
      ))}
      <span className="text-xs text-muted-foreground ml-2">{description}</span>
    </div>
  );
}
