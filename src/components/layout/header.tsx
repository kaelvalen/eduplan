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
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
  { key: 'G T', description: 'Öğretmenler' },
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

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/': 'Ana Sayfa',
      '/teachers': 'Öğretmenler',
      '/courses': 'Dersler',
      '/classrooms': 'Derslikler',
      '/schedules': 'Ders Programı',
      '/scheduler': 'Program Oluşturucu',
      '/reports': 'Raporlar',
      '/settings': 'Ayarlar',
      '/profile': 'Profil',
      '/import-export': 'İçe/Dışa Aktar',
    };
    return routes[pathname] || 'PlanEdu';
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between glass mx-3 mt-3 rounded-2xl px-4 md:px-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden rounded-xl h-10 w-10 tap-highlight-none hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}

          {/* Mobile Page Title */}
          <div className="md:hidden">
            <h1 className="text-base font-semibold truncate max-w-[150px] text-foreground/90">{getPageTitle()}</h1>
          </div>

          {/* Desktop Page Title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-foreground/90">{getPageTitle()}</h1>
          </div>

          {/* Search Button - Desktop */}
          <Button
            variant="outline"
            className="hidden md:flex items-center gap-2 h-10 px-4 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all duration-300 w-64 justify-between group shadow-sm"
            onClick={handleSearchClick}
          >
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
              <span className="text-sm">Hızlı arama...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground group-hover:border-primary/30 transition-colors">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-1 md:gap-3">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl h-9 w-9 tap-highlight-none hover:bg-white/20"
            onClick={handleSearchClick}
          >
            <Search className="h-5 w-5" />
          </Button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-xl hover:bg-white/20 tap-highlight-none transition-colors border border-transparent hover:border-white/10">
                <div className="relative">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-semibold text-xs shadow-md">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold leading-none text-foreground/90">{user?.username}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                    {user?.role === 'admin' ? 'Yönetici' : 'Öğretmen'}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-2xl glass-card border-white/10 p-2">
              <div className="px-2 py-2 mb-2 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-inner">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{user?.username}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-amber-500" />
                      {user?.role === 'admin' ? 'Premium Üye' : 'Öğretmen'}
                    </p>
                  </div>
                </div>
              </div>

              <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary mb-1">
                <Link href="/profile" className="flex items-center py-2.5">
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild className="rounded-xl cursor-pointer focus:bg-primary/10 focus:text-primary mb-1">
                  <Link href="/settings" className="flex items-center py-2.5">
                    <Settings className="mr-2 h-4 w-4" />
                    Ayarlar
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator className="bg-white/10 my-1" />

              <DropdownMenuItem
                onClick={logout}
                className="rounded-xl cursor-pointer text-rose-500 focus:text-rose-600 focus:bg-rose-500/10 py-2.5 mt-1"
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
