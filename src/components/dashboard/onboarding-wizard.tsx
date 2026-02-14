'use client';

import { CheckCircle2, ArrowRight, Users, BookOpen, Building2, Calendar, Settings } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Statistics } from '@/types';

interface OnboardingWizardProps {
  stats: Statistics;
  className?: string;
}

export function OnboardingWizard({ stats, className }: OnboardingWizardProps) {
  // Define steps with logic to check completion
  const steps = [
    {
      id: 'settings',
      title: 'Sistem Ayarları',
      description: 'Ders saatleri, öğle arası ve diğer genel ayarları yapılandırın.',
      icon: Settings,
      href: '/settings',
      // Assume settings are done if we are here (defaults exist), but user should check them.
      // We can mark it complete if they visited, but for now let's always show it as step 1 or complete if others are started.
      isComplete: stats.teacherCount > 0 || stats.classroomCount > 0,
      actionLabel: 'Ayarları Yapılandır',
    },
    {
      id: 'teachers',
      title: 'Öğretim Elemanları',
      description: 'Öğretim elemanlarını sisteme ekleyin.',
      icon: Users,
      href: '/teachers/new',
      isComplete: stats.teacherCount > 0,
      currentCount: stats.teacherCount,
      targetCount: 5, // Suggest at least 5
      actionLabel: 'Öğretim Elemanı Ekle',
    },
    {
      id: 'classrooms',
      title: 'Derslikler',
      description: 'Derslerin işleneceği sınıfları ve laboratuvarları tanımlayın.',
      icon: Building2,
      href: '/classrooms/new',
      isComplete: stats.classroomCount > 0,
      currentCount: stats.classroomCount,
      targetCount: 3,
      actionLabel: 'Derslik Ekle',
    },
    {
      id: 'courses',
      title: 'Dersler',
      description: 'Müfredatta yer alan dersleri oluşturun.',
      icon: BookOpen,
      href: '/courses/new',
      isComplete: stats.courseCount > 0,
      currentCount: stats.courseCount,
      targetCount: 5,
      actionLabel: 'Ders Ekle',
    },
    {
      id: 'scheduler',
      title: 'Program Oluştur',
      description: 'Tüm veriler hazır olduğunda otomatik programı çalıştırın.',
      icon: Calendar,
      href: '/scheduler',
      isComplete: stats.scheduleCount > 0,
      currentCount: stats.scheduleCount,
      actionLabel: 'Program Oluştur',
    },
  ];

  // Calculate overall progress
  const completedSteps = steps.filter(s => s.isComplete).length;
  const progress = (completedSteps / steps.length) * 100;

  // Find current active step (first incomplete step)
  const activeStepIndex = steps.findIndex(s => !s.isComplete);

  if (progress === 100) return null; // Hide if fully complete

  return (
    <Card className={cn("border-2 border-primary/20 shadow-xl overflow-hidden", className)}>
      <div className="absolute top-0 left-0 w-full h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <CardHeader className="bg-muted/30 pb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl text-primary flex items-center gap-2">
              🚀 Kurulum Sihirbazı
            </CardTitle>
            <CardDescription className="text-base">
              Ders programınızı oluşturmak için aşağıdaki adımları tamamlayın.
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground font-medium">Tamamlandı</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid md:grid-cols-5 divide-y md:divide-y-0 md:divide-x border-t">
          {steps.map((step, index) => {
            const isActive = index === activeStepIndex;
            const isPast = index < activeStepIndex || (activeStepIndex === -1); // Completed

            return (
              <div
                key={step.id}
                className={cn(
                  "p-4 flex flex-col items-center text-center transition-colors duration-200",
                  isActive ? "bg-primary/5 ring-inset ring-2 ring-primary/20" : "hover:bg-muted/50",
                  isPast ? "opacity-70 grayscale-[0.3]" : ""
                )}
              >
                <div className={cn(
                  "mb-3 p-3 rounded-full transition-all duration-300",
                  isActive ? "bg-primary text-primary-foreground scale-110 shadow-lg" :
                  isPast ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-muted text-muted-foreground"
                )}>
                  {isPast ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                </div>

                <h3 className={cn("font-semibold mb-1", isActive && "text-primary")}>{step.title}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[2.5em]">
                  {step.description}
                </p>

                {step.currentCount !== undefined && !isPast && (
                   <div className="text-xs font-medium text-muted-foreground mb-3 bg-muted px-2 py-1 rounded-md">
                     Mevcut: {step.currentCount}
                   </div>
                )}

                <Link href={step.href} className="mt-auto w-full">
                  <Button
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className="w-full text-xs"
                    disabled={index > activeStepIndex && activeStepIndex !== -1}
                  >
                    {isPast ? 'Düzenle' : step.actionLabel}
                    {isActive && <ArrowRight className="ml-1 h-3 w-3" />}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
