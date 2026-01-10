'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Users,
  BookOpen,
  Building2,
  Calendar,
  Settings,
  Cog,
  BarChart3,
  FileSpreadsheet,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Command,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { teachersApi, coursesApi, classroomsApi } from '@/lib/api';
import { getEntityColors } from '@/lib/design-tokens';
import type { Teacher, Course, Classroom } from '@/types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResult = {
  id: string;
  type: 'page' | 'teacher' | 'course' | 'classroom' | 'action';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  entity?: 'teachers' | 'courses' | 'classrooms' | 'schedules' | 'scheduler' | 'reports' | 'settings' | 'import';
};

const pages: SearchResult[] = [
  { id: 'home', type: 'page', title: 'Ana Sayfa', icon: Home, href: '/', entity: 'scheduler' },
  { id: 'teachers', type: 'page', title: 'Öğretmenler', subtitle: 'Öğretmen listesi', icon: Users, href: '/teachers', entity: 'teachers' },
  { id: 'courses', type: 'page', title: 'Dersler', subtitle: 'Ders listesi', icon: BookOpen, href: '/courses', entity: 'courses' },
  { id: 'classrooms', type: 'page', title: 'Derslikler', subtitle: 'Derslik listesi', icon: Building2, href: '/classrooms', entity: 'classrooms' },
  { id: 'schedules', type: 'page', title: 'Ders Programı', subtitle: 'Haftalık program', icon: Calendar, href: '/schedules', entity: 'schedules' },
  { id: 'scheduler', type: 'page', title: 'Program Oluşturucu', subtitle: 'Otomatik program', icon: Cog, href: '/scheduler', entity: 'scheduler' },
  { id: 'reports', type: 'page', title: 'Raporlar', subtitle: 'İstatistikler', icon: BarChart3, href: '/reports', entity: 'reports' },
  { id: 'import-export', type: 'page', title: 'İçe/Dışa Aktar', subtitle: 'Excel aktarım', icon: FileSpreadsheet, href: '/import-export', entity: 'import' },
  { id: 'settings', type: 'page', title: 'Ayarlar', subtitle: 'Sistem ayarları', icon: Settings, href: '/settings', entity: 'settings' },
  { id: 'profile', type: 'page', title: 'Profil', subtitle: 'Hesap bilgileri', icon: User, href: '/profile', entity: 'settings' },
];

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { isAdmin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([
        teachersApi.getAll().catch(() => []),
        coursesApi.getAll().catch(() => []),
        classroomsApi.getAll().catch(() => []),
      ]).then(([t, c, cl]) => {
        setTeachers(t);
        setCourses(c);
        setClassrooms(cl);
        setIsLoading(false);
      });
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Actions
  const actions: SearchResult[] = useMemo(() => [
    ...(isAdmin ? [
      { id: 'new-teacher', type: 'action' as const, title: 'Yeni Öğretmen Ekle', icon: Plus, href: '/teachers/new', entity: 'teachers' as const },
      { id: 'new-course', type: 'action' as const, title: 'Yeni Ders Ekle', icon: Plus, href: '/courses/new', entity: 'courses' as const },
      { id: 'new-classroom', type: 'action' as const, title: 'Yeni Derslik Ekle', icon: Plus, href: '/classrooms/new', entity: 'classrooms' as const },
    ] : []),
    {
      id: 'toggle-theme',
      type: 'action' as const,
      title: theme === 'dark' ? 'Açık Tema' : 'Koyu Tema',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      entity: 'settings' as const,
    },
    { id: 'logout', type: 'action' as const, title: 'Çıkış Yap', icon: LogOut, action: logout, entity: 'settings' as const },
  ], [isAdmin, theme, setTheme, logout]);

  // Build search results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    const items: SearchResult[] = [];

    // Filter pages
    const filteredPages = pages.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q)
    );
    items.push(...filteredPages);

    // Filter teachers
    if (q.length > 0) {
      const filteredTeachers = teachers
        .filter(t => t.name.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(t => ({
          id: `teacher-${t.id}`,
          type: 'teacher' as const,
          title: t.name,
          subtitle: t.email || 'Öğretmen',
          icon: Users,
          href: `/teachers/${t.id}/edit`,
          entity: 'teachers' as const,
        }));
      items.push(...filteredTeachers);

      // Filter courses
      const filteredCourses = courses
        .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({
          id: `course-${c.id}`,
          type: 'course' as const,
          title: c.name,
          subtitle: c.code,
          icon: BookOpen,
          href: `/courses/${c.id}/edit`,
          entity: 'courses' as const,
        }));
      items.push(...filteredCourses);

      // Filter classrooms
      const filteredClassrooms = classrooms
        .filter(c => c.name.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({
          id: `classroom-${c.id}`,
          type: 'classroom' as const,
          title: c.name,
          subtitle: `Kapasite: ${c.capacity}`,
          icon: Building2,
          href: `/classrooms/${c.id}/edit`,
          entity: 'classrooms' as const,
        }));
      items.push(...filteredClassrooms);
    }

    // Filter actions
    const filteredActions = actions.filter(a => a.title.toLowerCase().includes(q));
    items.push(...filteredActions);

    return items;
  }, [query, teachers, courses, classrooms, actions]);

  // Handle selection
  const handleSelect = useCallback((item: SearchResult) => {
    if (item.action) {
      item.action();
    } else if (item.href) {
      router.push(item.href);
    }
    onClose();
  }, [router, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, handleSelect, onClose]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-3 top-[10%] sm:inset-x-auto sm:left-1/2 sm:top-[20%] z-[80] w-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
        <div className="overflow-hidden rounded-2xl glass-panel shadow-2xl ring-1 ring-white/20 dark:ring-white/10">
          {/* Search Input */}
          <div className="flex items-center border-b border-border/40 px-3 sm:px-4 bg-white/5">
            <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Ne yapmak istiyorsunuz?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent px-3 sm:px-4 py-3 sm:py-4 text-base sm:text-lg outline-none placeholder:text-muted-foreground/50 font-medium"
              autoFocus
            />
            <button
              onClick={onClose}
              className="sm:hidden p-2 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 font-mono text-[10px] text-muted-foreground shadow-sm">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <p className="text-base font-medium text-foreground/80 mb-1">Sonuç bulunamadı</p>
                <p>Aradığınız kriterlere uygun sonuç yok.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((item, index) => {
                  const Icon = item.icon;
                  const colors = item.entity ? getEntityColors(item.entity) : null;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-3 sm:py-2.5 text-left text-sm transition-all duration-200 active:scale-[0.98]',
                        index === selectedIndex
                          ? 'bg-gradient-to-r from-primary/20 to-primary/10 text-foreground border border-primary/20 shadow-sm backdrop-blur-md'
                          : 'hover:bg-white/5 text-muted-foreground hover:text-foreground border border-transparent'
                      )}
                    >
                      <div className={cn(
                        'flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-lg flex-shrink-0 shadow-sm transition-colors',
                        index === selectedIndex
                          ? 'bg-primary text-white shadow-md'
                          : 'bg-white/10'
                      )}>
                        <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold truncate text-base sm:text-sm",
                          index === selectedIndex && "text-primary"
                        )}>{item.title}</p>
                        {item.subtitle && (
                          <p className={cn(
                            'text-xs truncate transition-colors',
                            index === selectedIndex
                              ? 'text-foreground/70'
                              : 'text-muted-foreground/80'
                          )}>
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                      <ArrowRight className={cn(
                        'h-4 w-4 transition-all duration-200 flex-shrink-0',
                        index === selectedIndex ? 'opacity-100 translate-x-0 text-primary' : 'opacity-0 -translate-x-2'
                      )} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Hidden on mobile */}
          <div className="hidden sm:flex items-center justify-between border-t border-border/40 px-4 py-2.5 bg-white/5 backdrop-blur-md text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 border border-white/5 px-1.5 py-0.5 font-mono shadow-sm">↑↓</kbd>
                Gezin
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/10 border border-white/5 px-1.5 py-0.5 font-mono shadow-sm">↵</kbd>
                Seç
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Command className="h-3 w-3 opacity-50" />
              <span><strong className="font-medium text-foreground/80">PlanEdu</strong> Command Palette</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook for keyboard shortcut
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(prev => !prev),
  };
}
