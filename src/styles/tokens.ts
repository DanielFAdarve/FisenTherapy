// ============================================================
// FISENT - DESIGN TOKENS (TypeScript)
// ============================================================
// Fuente unica de verdad para el sistema de diseno.
// Todos los componentes deben referenciar estos tokens.
// ============================================================

export const colors = {
  // Primary (Teal)
  primary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },

  // Secondary (Emerald)
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },

  // Neutral (Slate)
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic
  success: { DEFAULT: '#10b981', light: '#d1fae5', dark: '#047857' },
  warning: { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
  danger: { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
  info: { DEFAULT: '#3b82f6', light: '#dbeafe', dark: '#1d4ed8' },

  // Avatar colors
  avatars: {
    teal: { bg: '#ccfbf1', text: '#0f766e' },
    blue: { bg: '#dbeafe', text: '#1d4ed8' },
    purple: { bg: '#ede9fe', text: '#6d28d9' },
    amber: { bg: '#fef3c7', text: '#b45309' },
    emerald: { bg: '#d1fae5', text: '#047857' },
    rose: { bg: '#ffe4e6', text: '#be123c' },
  },
} as const;

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const radius = {
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
} as const;

export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  primary: 'shadow-lg shadow-teal-500/20',
} as const;

export const typography = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
} as const;

export const transitions = {
  fast: 'transition-all duration-150',
  normal: 'transition-all duration-200',
  slow: 'transition-all duration-300',
} as const;

// ============================================================
// BREAKPOINTS (matching Tailwind)
// ============================================================
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================
// RESPONSIVE HELPERS
// ============================================================

/**
 * Responsive class utility
 * Usage: responsive('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-4')
 */
export function responsive(...classes: string[]): string {
  return classes.join(' ');
}

/**
 * Grid columns responsive
 */
export const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  sm2: 'sm:grid-cols-2',
  sm3: 'sm:grid-cols-3',
  md2: 'md:grid-cols-2',
  md3: 'md:grid-cols-3',
  lg2: 'lg:grid-cols-2',
  lg3: 'lg:grid-cols-3',
  lg4: 'lg:grid-cols-4',
} as const;

/**
 * Common responsive layout patterns
 */
export const layouts = {
  // Page container
  page: 'max-w-7xl mx-auto',

  // Card grids
  cardGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
  cardGridCompact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  cardGridWide: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',

  // Stat grids
  statGrid: 'grid grid-cols-2 lg:grid-cols-4 gap-4',
  statGridCompact: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',

  // Form grids
  formGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  formGridWide: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',

  // Content layouts
  contentWithSidebar: 'flex flex-col lg:flex-row gap-6',
  twoColumn: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  threeColumn: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
  mainWithSidebar: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
} as const;

/**
 * Responsive padding patterns
 */
export const padding = {
  page: 'p-4 md:p-6 lg:p-8',
  card: 'p-4 md:p-5 lg:p-6',
  cardHeader: 'px-4 py-3 md:px-6 md:py-4',
  cardBody: 'p-4 md:p-5',
  modal: 'p-4 md:p-6',
  table: 'px-3 py-2 md:px-5 md:py-3.5',
} as const;

/**
 * Responsive text patterns
 */
export const text = {
  pageTitle: 'text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight',
  sectionTitle: 'text-base md:text-lg font-bold text-gray-900',
  cardTitle: 'text-sm md:text-base font-bold text-gray-900',
  body: 'text-sm text-gray-600',
  caption: 'text-xs text-gray-400',
  label: 'text-xs md:text-sm font-semibold text-gray-700',
} as const;
