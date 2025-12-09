// Design Tokens - Merkezi stil tanımları
// Tüm renkler, spacing, animasyonlar burada tanımlanır

export const colors = {
  // Semantic colors for different entities
  entities: {
    teachers: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
      gradient: 'from-blue-500 to-blue-600',
      icon: 'text-blue-500',
    },
    courses: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: 'text-emerald-500',
    },
    classrooms: {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-800',
      gradient: 'from-violet-500 to-violet-600',
      icon: 'text-violet-500',
    },
    schedules: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
      gradient: 'from-amber-500 to-orange-600',
      icon: 'text-amber-500',
    },
    scheduler: {
      bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-200 dark:border-cyan-800',
      gradient: 'from-cyan-500 to-cyan-600',
      icon: 'text-cyan-500',
    },
    reports: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-200 dark:border-indigo-800',
      gradient: 'from-indigo-500 to-indigo-600',
      icon: 'text-indigo-500',
    },
    settings: {
      bg: 'bg-gray-100 dark:bg-gray-900/30',
      text: 'text-gray-600 dark:text-gray-400',
      border: 'border-gray-200 dark:border-gray-800',
      gradient: 'from-gray-500 to-gray-600',
      icon: 'text-gray-500',
    },
    import: {
      bg: 'bg-teal-100 dark:bg-teal-900/30',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-200 dark:border-teal-800',
      gradient: 'from-teal-500 to-teal-600',
      icon: 'text-teal-500',
    },
  },
  // Status colors
  status: {
    success: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    warning: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-200 dark:border-amber-800',
    },
    error: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-200 dark:border-rose-800',
    },
    info: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800',
    },
  },
} as const;

// Page configurations
export const pageConfig = {
  teachers: {
    title: 'Öğretmenler',
    description: 'Öğretmen bilgilerini görüntüle ve yönet',
    ...colors.entities.teachers,
  },
  courses: {
    title: 'Dersler',
    description: 'Ders bilgilerini görüntüle ve yönet',
    ...colors.entities.courses,
  },
  classrooms: {
    title: 'Derslikler',
    description: 'Derslik bilgilerini görüntüle ve yönet',
    ...colors.entities.classrooms,
  },
  schedules: {
    title: 'Ders Programı',
    description: 'Haftalık ders programını görüntüle',
    ...colors.entities.schedules,
  },
  scheduler: {
    title: 'Program Oluşturucu',
    description: 'Genetik algoritma ile otomatik program oluştur',
    ...colors.entities.scheduler,
  },
  reports: {
    title: 'Raporlar',
    description: 'Sistem raporlarını görüntüle',
    ...colors.entities.reports,
  },
  settings: {
    title: 'Ayarlar',
    description: 'Sistem ayarlarını yönet',
    ...colors.entities.settings,
  },
  'import-export': {
    title: 'İçe/Dışa Aktar',
    description: 'Verileri içe veya dışa aktar',
    ...colors.entities.import,
  },
  profile: {
    title: 'Profil',
    description: 'Profil bilgilerini görüntüle ve düzenle',
    ...colors.entities.settings,
  },
} as const;

export type PageKey = keyof typeof pageConfig;
export type EntityKey = keyof typeof colors.entities;
export type StatusKey = keyof typeof colors.status;

// Spacing tokens
export const spacing = {
  page: 'p-4 md:p-6 lg:p-8',
  section: 'space-y-6',
  card: 'p-6',
  cardCompact: 'p-4',
} as const;

// Animation classes
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  float: 'animate-float',
  glow: 'animate-glow',
  pulse: 'animate-pulse',
} as const;

// Common component styles
export const styles = {
  // Page container
  pageContainer: 'space-y-6 animate-fade-in',
  
  // Page header with icon
  pageHeader: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4',
  pageHeaderIcon: 'p-3 rounded-2xl',
  pageHeaderTitle: 'text-2xl md:text-3xl font-bold',
  pageHeaderDescription: 'text-muted-foreground',
  
  // Cards
  card: 'rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200',
  cardHover: 'hover:shadow-lg hover:-translate-y-1 cursor-pointer',
  cardGradient: 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent',
  
  // Stat cards
  statCard: 'group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
  statCardOverlay: 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  statCardContent: 'relative p-6',
  
  // Icon containers
  iconContainer: 'p-3 rounded-xl',
  iconContainerLg: 'p-4 rounded-2xl',
  iconContainerGradient: 'gradient-primary text-white shadow-lg',
  
  // Buttons
  buttonPrimary: 'shadow-lg shadow-primary/20',
  buttonWithIcon: 'flex items-center gap-2',
  
  // Forms
  formSection: 'space-y-4',
  formLabel: 'text-sm font-medium',
  
  // Tables
  tableContainer: 'rounded-2xl border border-border/50 overflow-hidden',
  
  // Empty states
  emptyState: 'flex flex-col items-center justify-center py-16 px-6 text-center',
  
  // Breadcrumb
  breadcrumb: 'flex flex-wrap items-center gap-2 text-sm',
  breadcrumbItem: 'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
  breadcrumbItemActive: 'bg-primary text-primary-foreground font-medium',
  breadcrumbItemInactive: 'text-muted-foreground hover:bg-muted',
  
  // Search
  searchContainer: 'relative max-w-md',
  searchIcon: 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground',
  searchInput: 'pl-12 h-12 text-base',
  
  // Hero section
  hero: 'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-violet-600 p-8 text-white',
  heroDecorCircle: 'absolute rounded-full bg-white/10',
  heroContent: 'relative z-10',
  
  // Decorative blurs
  decorBlur: 'absolute rounded-full blur-3xl',
  decorBlurPrimary: 'bg-primary/10',
  decorBlurViolet: 'bg-violet-500/10',
} as const;

// Get entity color classes
export function getEntityColors(entity: EntityKey) {
  return colors.entities[entity];
}

// Get status color classes
export function getStatusColors(status: StatusKey) {
  return colors.status[status];
}

// Get page config
export function getPageConfig(page: PageKey) {
  return pageConfig[page];
}

// Combine classes helper
export function cx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}
