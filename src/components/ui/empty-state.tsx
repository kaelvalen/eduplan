import { LucideIcon, FileQuestion, Search, Calendar, Users, BookOpen, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in',
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
        <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 border border-primary/10">
          <Icon className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="lg" className="shadow-lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Pre-configured empty states
export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="Sonuç bulunamadı"
      description={`"${query}" araması için sonuç bulunamadı. Farklı anahtar kelimeler deneyin.`}
    />
  );
}

export function NoSchedule({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <EmptyState
      icon={Calendar}
      title="Ders programı bulunamadı"
      description="Henüz bir ders programı oluşturulmamış. Program oluşturucu ile otomatik program oluşturabilirsiniz."
      action={onGenerate ? { label: 'Program Oluştur', onClick: onGenerate } : undefined}
    />
  );
}

export function NoTeachers({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Öğretim elemanı bulunamadı"
      description="Henüz öğretim elemanı eklenmemiş. Yeni öğretim elemanı ekleyerek başlayın."
      action={onAdd ? { label: 'Öğretim Elemanı Ekle', onClick: onAdd } : undefined}
    />
  );
}

export function NoCourses({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="Ders bulunamadı"
      description="Henüz ders eklenmemiş. Yeni ders ekleyerek başlayın."
      action={onAdd ? { label: 'Ders Ekle', onClick: onAdd } : undefined}
    />
  );
}

export function NoClassrooms({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={Building2}
      title="Derslik bulunamadı"
      description="Henüz derslik eklenmemiş. Yeni derslik ekleyerek başlayın."
      action={onAdd ? { label: 'Derslik Ekle', onClick: onAdd } : undefined}
    />
  );
}
