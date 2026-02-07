import * as React from 'react';
import { Zap, Plus, Upload, FileSpreadsheet, Calendar, Users } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody } from './widget-container';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: 'Öğretmen Ekle',
    description: 'Yeni öğretmen kaydı',
    icon: Users,
    href: '/teachers/new',
    color: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/30',
  },
  {
    label: 'Ders Ekle',
    description: 'Yeni ders oluştur',
    icon: Plus,
    href: '/courses/new',
    color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30',
  },
  {
    label: 'Program Oluştur',
    description: 'Otomatik programlama',
    icon: Calendar,
    href: '/scheduler',
    color: 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-950/30',
  },
  {
    label: 'Veri İçe Aktar',
    description: 'Excel/CSV yükle',
    icon: Upload,
    href: '/import-export',
    color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/30',
  },
];

const QuickActionsWidgetComponent = () => {
  return (
    <WidgetContainer variant="gradient">
      <WidgetHeader
        title="Hızlı İşlemler"
        subtitle="Sık kullanılan işlemler"
        icon={Zap}
        iconColor="bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
      />
      <WidgetBody>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group"
              >
                <div className={cn(
                  'p-4 rounded-xl border border-border/40 transition-all duration-200',
                  'hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5',
                  'bg-card'
                )}>
                  <div className={cn(
                    'inline-flex p-2.5 rounded-lg mb-3 transition-colors',
                    action.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1 leading-tight">
                    {action.label}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </WidgetBody>
    </WidgetContainer>
  );
};

export const QuickActionsWidget = React.memo(QuickActionsWidgetComponent);
