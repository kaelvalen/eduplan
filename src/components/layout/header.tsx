'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  User,
  Settings,
  Search,
  Menu,
  Command,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeColorPicker } from '@/components/ui/theme-color-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { NotificationCenter } from '@/components/ui/notification-center';

const shortcuts = [
  { key: '⌘ K', description: 'Arama' },
  { key: 'G H', description: 'Ana sayfaya git' },
  { key: 'G T', description: 'Öğretim Elemanları' },
  { key: 'G C', description: 'Dersler' },
  { key: 'G S', description: 'Program' },
];


interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  onSearchClick?: () => void;
}

export function Header({ onMenuClick, showMenuButton = false, onSearchClick }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handle search click - use command palette
  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      // Trigger Ctrl+K programmatically
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];
    
    // Custom label mapping
    const labels: Record<string, string> = {
      'teachers': 'Öğretim Elemanları',
      'courses': 'Dersler',
      'classrooms': 'Derslikler',
      'programs': 'Ders Programı',
      'scheduler': 'Program Oluşturucu',
      'reports': 'Raporlar',
      'settings': 'Ayarlar',
      'profile': 'Profil',
      'import-export': 'İçe/Dışa Aktar',
    };

    let currentPath = '';
    
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      items.push({
        label: labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath
      });
    });

    return items;
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between bg-card/80 backdrop-blur-lg mx-3 mt-3 rounded-2xl px-5 md:px-8 mb-8 shadow-sm border border-border/40">
        <div className="flex items-center gap-3 md:gap-6">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden rounded-xl h-10 w-10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Breadcrumbs */}
          <div className="flex flex-col gap-0.5">
             <div className="hidden md:block">
               <Breadcrumb items={getBreadcrumbs()} />
             </div>
             {/* Mobile Page Title (keep for simple mobile view) */}
             <div className="md:hidden">
                <h1 className="text-lg font-semibold truncate max-w-[150px] text-foreground">
                  {getBreadcrumbs().length > 0 ? getBreadcrumbs().at(-1)?.label : 'PlanEdu'}
                </h1>
             </div>
          </div>

          {/* Search Button - Desktop */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 h-11 px-5 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-300 w-72 justify-between group shadow-sm hover:shadow-md"
            onClick={handleSearchClick}
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
              <span className="text-base">Arama yap...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-lg border border-border/60 bg-muted/50 px-2 font-mono text-[11px] font-medium text-muted-foreground group-hover:border-primary/40 transition-colors">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl h-10 w-10"
            onClick={handleSearchClick}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Color Picker */}
          <ThemeColorPicker />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-11 pl-2 pr-4 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border/60">
                <div className="relative">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/70 text-white font-semibold text-sm shadow-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400/80 ring-2 ring-background" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold leading-none text-foreground">{user?.username}</p>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {user?.role === 'admin' ? 'Yönetici' : 'Öğretim Elemanı'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-3">
              <div className="px-3 py-3 mb-3 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-accent/70 text-white font-bold shadow-sm">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{user?.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      {user?.role === 'admin' ? 'Premium Üye' : 'Öğretim Elemanı'}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer mb-1">
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer mb-1">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-border/40 my-2" />

              <DropdownMenuItem
                onClick={logout}
                className="rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 focus:text-rose-700 dark:focus:text-rose-300 focus:bg-rose-50 dark:focus:bg-rose-950/20 mt-1"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Çıkış Yap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

    </>
  );
}
