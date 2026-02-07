import * as React from 'react';
import { Activity, Database, HardDrive, Users, Zap, CheckCircle2 } from 'lucide-react';
import { WidgetContainer, WidgetHeader, WidgetBody } from './widget-container';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SystemMetric {
  label: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  icon: typeof Database;
}

interface SystemHealthWidgetProps {
  isAdmin: boolean;
}

const SystemHealthWidgetComponent = ({ isAdmin }: SystemHealthWidgetProps) => {
  if (!isAdmin) return null;

  // Mock data - bu veriler gerçek API'den gelecek
  const metrics: SystemMetric[] = [
    {
      label: 'Veritabanı',
      value: 'Aktif',
      status: 'healthy',
      icon: Database,
    },
    {
      label: 'Son Yedekleme',
      value: '2 saat önce',
      status: 'healthy',
      icon: HardDrive,
    },
    {
      label: 'Aktif Kullanıcılar',
      value: '12',
      status: 'healthy',
      icon: Users,
    },
    {
      label: 'Performans',
      value: 'İyi',
      status: 'healthy',
      icon: Zap,
    },
  ];

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'error':
        return 'text-rose-600 dark:text-rose-400';
    }
  };

  const getStatusBadge = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="success" className="text-xs">Sağlıklı</Badge>;
      case 'warning':
        return <Badge variant="warning" className="text-xs">Uyarı</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Hata</Badge>;
    }
  };

  const allHealthy = metrics.every((m) => m.status === 'healthy');

  return (
    <WidgetContainer>
      <WidgetHeader
        title="Sistem Durumu"
        subtitle="Sistem sağlık metrikleri"
        icon={Activity}
        iconColor={cn(
          'text-white',
          allHealthy ? 'bg-emerald-500' : 'bg-amber-500'
        )}
        action={allHealthy && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
      />
      <WidgetBody>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    metric.status === 'healthy' && 'bg-emerald-50 dark:bg-emerald-950/20',
                    metric.status === 'warning' && 'bg-amber-50 dark:bg-amber-950/20',
                    metric.status === 'error' && 'bg-rose-50 dark:bg-rose-950/20'
                  )}>
                    <Icon className={cn('h-4 w-4', getStatusColor(metric.status))} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {metric.label}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {metric.value}
                    </div>
                  </div>
                </div>
                {getStatusBadge(metric.status)}
              </div>
            );
          })}
        </div>

        {allHealthy && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Tüm sistemler normal çalışıyor
              </p>
            </div>
          </div>
        )}
      </WidgetBody>
    </WidgetContainer>
  );
};

export const SystemHealthWidget = React.memo(SystemHealthWidgetComponent);
