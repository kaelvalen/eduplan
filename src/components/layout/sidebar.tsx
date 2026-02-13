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
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Tooltip } from '@/components/ui/tooltip';

const navigation = [
  { name: 'Ana Sayfa', href: '/', icon: Home, color: 'text-purple-400' },
  { name: 'Öğretim Elemanları', href: '/teachers', icon: Users, color: 'text-blue-400' },
  { name: 'Dersler', href: '/courses', icon: BookOpen, color: 'text-emerald-400' },
  { name: 'Derslikler', href: '/classrooms', icon: Building2, color: 'text-amber-400' },
  { name: 'Ders Programı', href: '/programs', icon: Calendar, color: 'text-rose-400' },
];

const adminNavigation = [
  { name: 'Program Oluşturucu', href: '/scheduler', icon: Cog, color: 'text-sky-400' },
  { name: 'Raporlar', href: '/reports', icon: BarChart3, color: 'text-purple-400' },
  { name: 'İçe/Dışa Aktar', href: '/import-export', icon: FileSpreadsheet, color: 'text-teal-400' },
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
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300',
          active
            ? 'text-white'
            : 'text-muted-foreground hover:bg-white/10 hover:text-foreground',
          isCollapsed && 'justify-center px-2'
        )}
      >
        {active && (
          <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/90 to-accent/70 shadow-md shadow-primary/10 animate-scale-in" />
        )}
        <span className="relative flex items-center gap-3">
          <Icon className={cn(
            'h-5 w-5 flex-shrink-0 transition-colors',
            active ? 'text-white' : item.color
          )} />
          {!isCollapsed && <span>{item.name}</span>}
        </span>
        {!active && !isCollapsed && (
          <span className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity group-hover:opacity-100" />
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
      <div className="flex h-16 items-center justify-between px-4 mt-2">
        <Link href="/" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/70 shadow-md shadow-primary/15 transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5 text-white" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400/80 border-2 border-card animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-sky-400 to-teal-400">
                PlanEdu
              </span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                <Sparkles className="h-2.5 w-2.5 text-amber-400" /> PRO v3.0
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
            className="hidden md:flex h-8 w-8 rounded-lg hover:bg-white/10"
          >
            <ChevronLeft className={cn('h-4 w-4 transition-transform duration-300', isCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      {/* User Card */}
      {!isCollapsed && (
        <div className="mx-3 mt-4 mb-4">
          <div className="rounded-xl bg-white/5 p-3 border border-white/10 backdrop-blur-sm shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/70 text-white font-bold text-sm shadow-sm">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400/80 border-2 border-card shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-foreground">{user?.username}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {user?.role === 'admin' ? (
                    <span className="flex items-center gap-1 text-amber-400"><Sparkles className="h-2 w-2" /> Yönetici</span>
                  ) : '👤 Öğretim Elemanı'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-hide">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 mb-2 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
              Ana Menü
            </p>
          )}
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} active={isActive(item.href)} />
          ))}
        </div>

        {isAdmin && (
          <div className="mt-8 space-y-1">
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider">
                Yönetim Paneli
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
          <div className="mt-4 px-3 py-3 rounded-xl bg-white/5 border border-white/5 text-center">
            <p className="text-[10px] text-muted-foreground/80">
              © 2026 PlanEdu
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
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-[60] h-screen glass border-r-0 transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)',
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
