'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  User,
  Settings,
  Bell,
  Search,
  Menu,
  Command,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const shortcuts = [
  { key: '⌘ K', description: 'Arama' },
  { key: 'G H', description: 'Ana sayfaya git' },
  { key: 'G T', description: 'Öğretmenler' },
  { key: 'G C', description: 'Dersler' },
  { key: 'G S', description: 'Program' },
];

const notifications = [
  {
    id: 1,
    title: 'Program oluşturuldu',
    message: 'Yeni ders programı başarıyla oluşturuldu.',
    time: '2 dakika önce',
    type: 'success',
    icon: CheckCircle2
  },
  {
    id: 2,
    title: 'Yeni öğretmen eklendi',
    message: 'Dr. Ahmet Yılmaz sisteme eklendi.',
    time: '1 saat önce',
    type: 'info',
    icon: Info
  },
  {
    id: 3,
    title: 'Çakışma uyarısı',
    message: '2 derste zaman çakışması tespit edildi.',
    time: '3 saat önce',
    type: 'warning',
    icon: AlertTriangle
  },
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-xl h-10 w-10 tap-highlight-none hover:bg-white/20 transition-colors">
                <Bell className="h-5 w-5 text-foreground/80" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-background animate-pulse" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] md:w-80 max-w-80 rounded-2xl p-0 overflow-hidden glass-card border-none">
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">Bildirimler</p>
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    3 yeni
                  </span>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <div
                      key={notif.id}
                      className="flex gap-3 p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className={cn(
                        'flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center',
                        notif.type === 'success' && 'bg-emerald-500/10 text-emerald-500',
                        notif.type === 'warning' && 'bg-amber-500/10 text-amber-500',
                        notif.type === 'info' && 'bg-blue-500/10 text-blue-500'
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground/90">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-2 border-t border-white/5 bg-muted/20">
                <Button variant="ghost" className="w-full h-8 text-xs rounded-lg hover:bg-white/10">
                  Tüm bildirimleri gör
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* Keyboard Shortcuts Dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md glass-card border-white/10">
          <DialogHeader>
            <DialogTitle>Klavye Kısayolları</DialogTitle>
            <DialogDescription>
              Hızlı navigasyon için klavye kısayollarını kullanın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                <span className="text-sm text-foreground/80">{shortcut.description}</span>
                <kbd className="px-2.5 py-1 text-xs font-semibold bg-white/10 rounded-md border border-white/10 text-foreground">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
