'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Users, GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Ana Sayfa',
      href: '/',
      icon: Home,
    },
    {
      label: 'Program',
      href: '/programs',
      icon: CalendarDays,
    },
    {
      label: 'Öğretmenler',
      href: '/teachers',
      icon: Users,
    },
    {
      label: 'Dersler',
      href: '/courses',
      icon: GraduationCap,
    },
    {
      label: 'Profil',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border pb-safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "p-1 rounded-xl transition-all",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
