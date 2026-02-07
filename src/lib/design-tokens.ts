// Design Tokens - Merkezi stil tanımları
// Tüm renkler, spacing, animasyonlar burada tanımlanır

export const colors = {
  // Semantic colors for different entities - Pastel palette
  entities: {
    teachers: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800/50',
      gradient: 'from-blue-400/80 to-indigo-400/80',
      icon: 'text-blue-600 dark:text-blue-400',
      dot: 'bg-blue-500/70',
    },
    courses: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      gradient: 'from-emerald-400/80 to-teal-400/80',
      icon: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500/70',
    },
    classrooms: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800/50',
      gradient: 'from-amber-400/80 to-orange-400/80',
      icon: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500/70',
    },
    schedules: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/50',
      gradient: 'from-rose-400/80 to-pink-400/80',
      icon: 'text-rose-600 dark:text-rose-400',
      dot: 'bg-rose-500/70',
    },
    scheduler: {
      bg: 'bg-sky-50 dark:bg-sky-950/20',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/50',
      gradient: 'from-sky-400/80 to-cyan-400/80',
      icon: 'text-sky-600 dark:text-sky-400',
      dot: 'bg-sky-500/70',
    },
    reports: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800/50',
      gradient: 'from-purple-400/80 to-violet-400/80',
      icon: 'text-purple-600 dark:text-purple-400',
      dot: 'bg-purple-500/70',
    },
    settings: {
      bg: 'bg-slate-50 dark:bg-slate-950/20',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800/50',
      gradient: 'from-slate-400/80 to-gray-400/80',
      icon: 'text-slate-600 dark:text-slate-400',
      dot: 'bg-slate-500/70',
    },
    import: {
      bg: 'bg-teal-50 dark:bg-teal-950/20',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800/50',
      gradient: 'from-teal-400/80 to-cyan-400/80',
      icon: 'text-teal-600 dark:text-teal-400',
      dot: 'bg-teal-500/70',
    },
  },
  // Status colors - Pastel versions
  status: {
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800/50',
    },
    warning: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800/50',
    },
    error: {
      bg: 'bg-rose-50 dark:bg-rose-950/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800/50',
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-950/20',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800/50',
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
    description: 'Akıllı sezgisel algoritma ile otomatik program oluştur',
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

// Spacing scale (in px: 2, 4, 6, 8, 12, 16, 24, 32, 48, 64)
export const spacing = {
  xs: '0.125rem',    // 2px
  sm: '0.25rem',     // 4px
  md: '0.375rem',    // 6px
  base: '0.5rem',    // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.5rem',   // 24px
  '3xl': '2rem',     // 32px
  '4xl': '3rem',     // 48px
  '5xl': '4rem',     // 64px

  // Common patterns
  page: 'p-4 md:p-6 lg:p-8',
  section: 'space-y-6',
  card: 'p-6',
  cardCompact: 'p-4',
  gap: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const;

// Typography scale
export const typography = {
  xs: 'text-xs',      // 0.75rem
  sm: 'text-sm',      // 0.875rem
  base: 'text-base',  // 1rem
  lg: 'text-lg',      // 1.125rem
  xl: 'text-xl',      // 1.25rem
  '2xl': 'text-2xl',  // 1.5rem
  '3xl': 'text-3xl',  // 1.875rem
  '4xl': 'text-4xl',  // 2.25rem

  // Weights
  weight: {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  },
} as const;

// Border radius scale
export const radius = {
  sm: 'rounded-lg',      // 0.5rem
  md: 'rounded-xl',      // 0.75rem
  lg: 'rounded-2xl',     // 1rem
  xl: 'rounded-3xl',     // 1.5rem
  full: 'rounded-full',  // 9999px
} as const;

// Shadow scale - softer for pastel theme
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  soft: 'shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
  glow: 'shadow-[0_0_20px_rgba(var(--primary),0.1)]',
} as const;

// Animation classes
export const animations = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  float: 'animate-float',
  glow: 'animate-glow',
  pulse: 'animate-pulse',
} as const;

// Common component styles - Pastel & Professional
export const styles = {
  // Page container
  pageContainer: 'space-y-6 animate-fade-in',

  // Page header with icon
  pageHeader: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4',
  pageHeaderIcon: 'p-3 rounded-2xl',
  pageHeaderTitle: 'text-2xl md:text-3xl font-bold',
  pageHeaderDescription: 'text-muted-foreground',

  // Cards - softer shadows
  card: 'rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-200',
  cardHover: 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
  cardGradient: 'bg-gradient-to-br from-primary/5 via-primary/3 to-transparent',
  cardElevated: 'rounded-2xl border border-border/40 bg-card shadow-md',
  cardFlat: 'rounded-2xl border border-border/60 bg-card',

  // Stat cards - reduced hover effect
  statCard: 'group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5',
  statCardOverlay: 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300',
  statCardContent: 'relative p-6',

  // Icon containers
  iconContainer: 'p-3 rounded-xl',
  iconContainerLg: 'p-4 rounded-2xl',
  iconContainerGradient: 'gradient-primary text-white shadow-md',

  // Buttons - softer shadows
  buttonPrimary: 'shadow-md shadow-primary/10',
  buttonWithIcon: 'flex items-center gap-2',

  // Forms
  formSection: 'space-y-4',
  formLabel: 'text-sm font-medium',
  formFieldGroup: 'space-y-2',

  // Tables
  tableContainer: 'rounded-2xl border border-border/50 overflow-hidden',

  // Empty states
  emptyState: 'flex flex-col items-center justify-center py-16 px-6 text-center',

  // Breadcrumb
  breadcrumb: 'flex flex-wrap items-center gap-2 text-sm',
  breadcrumbItem: 'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors',
  breadcrumbItemActive: 'bg-primary/80 text-white font-medium',
  breadcrumbItemInactive: 'text-muted-foreground hover:bg-muted/50',

  // Search
  searchContainer: 'relative max-w-md',
  searchIcon: 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground',
  searchInput: 'pl-12 h-12 text-base',

  // Hero section - pastel gradient
  hero: 'relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary/80 to-accent/70 p-8 text-foreground',
  heroDecorCircle: 'absolute rounded-full bg-white/5 dark:bg-white/3',
  heroContent: 'relative z-10',

  // Decorative blurs - softer
  decorBlur: 'absolute rounded-full blur-3xl',
  decorBlurPrimary: 'bg-primary/5',
  decorBlurAccent: 'bg-accent/5',
  decorBlurSecondary: 'bg-secondary/10',
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
