'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { LoadingBar } from '@/components/ui/loading-bar';
import { CommandPalette, useCommandPalette } from '@/components/ui/command-palette';
import { BottomNav } from '@/components/layout/bottom-nav';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar-collapsed') === 'true';
    }
    return false;
  });
  const commandPalette = useCommandPalette();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebar-collapsed', String(newValue));
      return newValue;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl + B to toggle sidebar
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        handleToggleCollapse();
      }
      
      // G + key for navigation (vim-style)
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const handleNavigation = (event: KeyboardEvent) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          
          switch (event.key) {
            case 'h':
              event.preventDefault();
              router.push('/');
              break;
            case 't':
              event.preventDefault();
              router.push('/teachers');
              break;
            case 'c':
              event.preventDefault();
              router.push('/courses');
              break;
            case 'r':
              event.preventDefault();
              router.push('/classrooms');
              break;
            case 's':
              event.preventDefault();
              router.push('/programs');
              break;
          }
          document.removeEventListener('keydown', handleNavigation);
        };
        
        document.addEventListener('keydown', handleNavigation, { once: true });
        setTimeout(() => {
          document.removeEventListener('keydown', handleNavigation);
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [router, handleToggleCollapse]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Loading Bar */}
      <Suspense fallback={null}>
        <LoadingBar />
      </Suspense>
      
      {/* Desktop Sidebar - hidden when printing */}
      <div className="hidden md:block print:hidden">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>
      
      {/* Mobile Sidebar - hidden when printing */}
      <div className="md:hidden print:hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
      
      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 min-h-screen print:pl-0',
          sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-72'
        )}
      >
        <div className="print:hidden">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            showMenuButton
            onSearchClick={commandPalette.open}
          />
        </div>
        <main className="p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 print:p-0 print:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile Bottom Navigation - hidden when printing */}
      <div className="print:hidden">
        <BottomNav />
      </div>

      {/* Scroll to Top Button - hidden when printing */}
      <div className="print:hidden">
        <ScrollToTop />
      </div>
      
      {/* Command Palette - hidden when printing */}
      <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
    </div>
  );
}
