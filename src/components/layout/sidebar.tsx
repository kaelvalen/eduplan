'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpen,
  Building2,
  Calendar,
  Settings,
  Cog,
  GraduationCap,
  X,
  ChevronLeft,
  BarChart3,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Ana Sayfa', href: '/', icon: Home, color: 'text-violet-500' },
  { name: 'Öğretmenler', href: '/teachers', icon: Users, color: 'text-blue-500' },
  { name: 'Dersler', href: '/courses', icon: BookOpen, color: 'text-emerald-500' },
  { name: 'Derslikler', href: '/classrooms', icon: Building2, color: 'text-amber-500' },
  { name: 'Ders Programı', href: '/schedules', icon: Calendar, color: 'text-rose-500' },
  { name: 'Bölüm Programları', href: '/programs', icon: GraduationCap, color: 'text-purple-500' },
];

const adminNavigation = [
  { name: 'Program Oluşturucu', href: '/scheduler', icon: Cog, color: 'text-cyan-500' },
  { name: 'Raporlar', href: '/reports', icon: BarChart3, color: 'text-indigo-500' },
  { name: 'İçe/Dışa Aktar', href: '/import-export', icon: FileSpreadsheet, color: 'text-teal-500' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Close handler for mobile sidebar
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const NavLink = ({ item, active }: { item: typeof navigation[0]; active: boolean }) => {
    const Icon = item.icon;

    const content = (
      <Link
        href={item.href}
        onClick={handleLinkClick}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          active
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        {active && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-primary/80 opacity-100" />
        )}
        <span className="relative flex items-center gap-3">
          <Icon className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            active ? 'text-primary-foreground' : item.color
          )} />
          {!isCollapsed && <span>{item.name}</span>}
        </span>
        {!active && !isCollapsed && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 to-primary/0 opacity-0 transition-opacity group-hover:opacity-5" />
        )}
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.name} content={item.name} side="right">
          {content}
        </Tooltip>
      );
    }
    return content;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-card animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold gradient-text">PlanEdu</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> v3.0
              </span>
            </div>
          )}
        </Link>

        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden rounded-xl">
            <X className="h-5 w-5" />
          </Button>
        )}

        {onToggleCollapse && !onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden md:flex h-8 w-8 rounded-lg"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', isCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      {/* User Card */}
      {!isCollapsed && (
        <div className="mx-3 mt-2 mb-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-white font-bold text-sm shadow-lg">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-card" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'admin' ? '👑 Yönetici' : '👤 Öğretmen'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 mb-3 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest">
              Ana Menü
            </p>
          )}
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} active={isActive(item.href)} />
          ))}
        </div>

        {isAdmin && (
          <div className="mt-6 space-y-1">
            {!isCollapsed && (
              <p className="px-3 mb-3 text-[11px] font-semibold uppercase text-muted-foreground/70 tracking-widest">
                Yönetim
              </p>
            )}
            {adminNavigation.map((item) => (
              <NavLink key={item.name} item={item} active={isActive(item.href)} />
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1">
        {isAdmin && (
          <NavLink
            item={{ name: 'Ayarlar', href: '/settings', icon: Settings, color: 'text-gray-500' }}
            active={isActive('/settings')}
          />
        )}

        {!isCollapsed && (
          <div className="mt-4 px-3 py-3 rounded-xl bg-muted/50">
            <p className="text-[10px] text-muted-foreground text-center">
              © 2025 PlanEdu • Tüm hakları saklıdır
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-md md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[60] h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 ease-out',
          isCollapsed ? 'w-[72px]' : 'w-72',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
