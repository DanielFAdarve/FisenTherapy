// ============================================================
// FISENT - UI COMPONENTS (Centralizados + Responsive)
// ============================================================
import { layouts, padding, text, gridCols, transitions } from '../../styles/tokens';

// Re-export layout helpers for use in pages
export { layouts, padding, text, gridCols, transitions };

// --- Skeleton Loader ---
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-xl ${className}`} />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 md:gap-4 items-center">
          <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-14 md:w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

// --- Badge ---
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[11px] md:text-xs font-semibold border ${badgeStyles[variant]}`}>
      {children}
    </span>
  );
}

export function getStatusBadge(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    ACTIVO: 'success', CERRADO: 'neutral', CANCELADO: 'danger',
    PROGRAMADA: 'info', CONFIRMADA: 'success', COMPLETADA: 'success',
    NO_ASISTIO: 'warning', PAGADO: 'success', PENDIENTE: 'warning',
    ABONADO: 'info', INACTIVO: 'danger',
  };
  return map[status] || 'neutral';
}

// --- Button ---
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
};

const btnVariants: Record<string, string> = {
  primary: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md shadow-teal-500/20',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm hover:shadow',
  danger: 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-md shadow-red-500/20',
  success: 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md shadow-emerald-500/20',
  ghost: 'hover:bg-gray-100 text-gray-600 hover:text-gray-900',
  outline: 'bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-teal-50',
};

const btnSizes: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({ variant = 'primary', size = 'md', isLoading, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] min-h-[44px] md:min-h-0 ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// --- Input ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, hint, leftIcon, id, className = '', ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>}
        <input
          id={inputId}
          className={`w-full rounded-xl border-2 px-3 py-2.5 text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-0 bg-white ${
            leftIcon ? 'pl-10' : ''
          } ${
            error
              ? 'border-red-300 bg-red-50/50 focus:border-red-500'
              : 'border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
          } ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
      </div>
      {hint && !error && <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && (
        <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-red-600 flex items-center gap-1" role="alert">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// --- Select ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder = 'Seleccionar...', id, className = '', ...props }: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <select
        id={selectId}
        className={`w-full rounded-xl border-2 px-3 py-2.5 text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-0 bg-white appearance-none cursor-pointer ${
          error
            ? 'border-red-300 bg-red-50/50 focus:border-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// --- Textarea ---
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, className = '', ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      )}
      <textarea
        id={textareaId}
        className={`w-full rounded-xl border-2 px-3 py-2.5 text-base md:text-sm transition-all duration-200 focus:outline-none focus:ring-0 bg-white resize-y ${
          error
            ? 'border-red-300 bg-red-50/50 focus:border-red-500'
            : 'border-gray-200 hover:border-gray-300 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
        } ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p>}
    </div>
  );
}

// --- Card ---
export function Card({ children, className = '', hover = false }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${hover ? 'hover:shadow-lg hover:border-gray-200 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
}

// --- Card Header ---
export function CardHeader({ title, subtitle, action, icon }: {
  title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        {icon && <div className="p-2 bg-teal-50 rounded-xl text-teal-600">{icon}</div>}
        <div>
          <h3 className="text-sm md:text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// --- Modal ---
export function Modal({
  isOpen, onClose, title, children, size = 'md',
}: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!isOpen) return null;

  const sizeMap: Record<string, string> = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:w-auto ${sizeMap[size]} max-h-[90vh] flex flex-col animate-slide-up`}>
        <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-5 border-b border-gray-100">
          <h2 className="text-base md:text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" aria-label="Cerrar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 md:px-6 md:py-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Empty State ---
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center px-4">
      {icon && <div className="mb-4 md:mb-5 p-4 bg-gray-50 rounded-2xl text-gray-300">{icon}</div>}
      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-400 mb-4 md:mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// --- Confirm Dialog ---
export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', confirmVariant = 'danger',
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; confirmText?: string; confirmVariant?: 'danger' | 'primary';
}) {
  if (!isOpen) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
        <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
        <Button variant={confirmVariant} onClick={() => { onConfirm(); onClose(); }} className="w-full sm:w-auto">{confirmText}</Button>
      </div>
    </Modal>
  );
}

// --- Stat Card ---
export function StatCard({ label, value, icon, color = 'teal', trend }: {
  label: string; value: string | number; icon?: React.ReactNode; color?: string; trend?: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string }> = {
    teal: { bg: 'bg-gradient-to-br from-teal-500 to-emerald-500', icon: 'text-white' },
    blue: { bg: 'bg-gradient-to-br from-blue-500 to-sky-500', icon: 'text-white' },
    amber: { bg: 'bg-gradient-to-br from-amber-500 to-orange-500', icon: 'text-white' },
    emerald: { bg: 'bg-gradient-to-br from-emerald-500 to-green-500', icon: 'text-white' },
    purple: { bg: 'bg-gradient-to-br from-purple-500 to-violet-500', icon: 'text-white' },
    red: { bg: 'bg-gradient-to-br from-red-500 to-rose-500', icon: 'text-white' },
  };
  const c = colorMap[color] || colorMap.teal;
  return (
    <Card className="p-4 md:p-5 overflow-hidden relative" hover>
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
          {trend && <p className="text-xs font-medium text-emerald-600">{trend}</p>}
        </div>
        {icon && <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl ${c.bg} ${c.icon} shadow-lg`}>{icon}</div>}
      </div>
      <div className={`absolute -bottom-4 -right-4 w-20 h-20 md:w-24 md:h-24 rounded-full ${c.bg} opacity-10 blur-xl`} />
    </Card>
  );
}

// --- Avatar ---
export function Avatar({ name, size = 'md', color = 'teal' }: { name: string; size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const initials = name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeMap: Record<string, string> = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 md:w-14 md:h-14 text-base md:text-lg' };
  const colorMap: Record<string, string> = {
    teal: 'bg-teal-100 text-teal-700', blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700', amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700', rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <div className={`${sizeMap[size]} rounded-full ${colorMap[color] || colorMap.teal} flex items-center justify-center font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
}

// --- Search Input ---
export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative w-full">
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-base md:text-sm focus:outline-none focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10 transition-all duration-200 bg-white"
      />
    </div>
  );
}

// --- Page Header ---
export function PageHeader({ icon, title, subtitle, action }: {
  icon: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 md:gap-4">
      <div className="flex items-center gap-2.5 md:gap-3">
        <div className="p-2 md:p-2.5 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-xl md:rounded-2xl text-white shadow-lg shadow-teal-500/20">
          {icon}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// --- Progress Bar ---
export function ProgressBar({ value, max, color = 'teal', showLabel = true }: {
  value: number; max: number; color?: string; showLabel?: boolean;
}) {
  const pct = Math.min((value / max) * 100, 100);
  const colorMap: Record<string, string> = {
    teal: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    blue: 'bg-gradient-to-r from-blue-500 to-sky-500',
    amber: 'bg-gradient-to-r from-amber-500 to-orange-500',
    red: 'bg-gradient-to-r from-red-500 to-rose-500',
  };
  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || colorMap.teal}`} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <p className="text-xs text-gray-400">{value}/{max} ({Math.round(pct)}%)</p>}
    </div>
  );
}

// --- Alert ---
export function Alert({ type = 'info', title, message, onClose }: {
  type?: 'info' | 'warning' | 'error' | 'success'; title?: string; message: string; onClose?: () => void;
}) {
  const styles: Record<string, string> = {
    info: 'bg-sky-50 border-sky-200 text-sky-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  return (
    <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl border ${styles[type]} flex items-start gap-2 md:gap-3`} role="alert">
      <div className="flex-1">
        {title && <p className="font-semibold text-xs md:text-sm mb-0.5">{title}</p>}
        <p className="text-xs md:text-sm">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/50 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// --- Tabs ---
export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[]; active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
            active === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              active === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-gray-200 text-gray-500'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// --- Responsive Grid ---
export function ResponsiveGrid({ children, cols = '1 sm:2 lg:3 xl:4', gap = '4', className = '' }: {
  children: React.ReactNode; cols?: string; gap?: string; className?: string;
}) {
  const colMap: Record<string, string> = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-2',
    '3': 'grid-cols-3',
    '4': 'grid-cols-4',
  };
  const gapMap: Record<string, string> = {
    '2': 'gap-2', '3': 'gap-3', '4': 'gap-4', '5': 'gap-5', '6': 'gap-6',
  };

  const colClasses = cols.split(' ').map(c => {
    if (c.includes(':')) {
      const [bp, num] = c.split(':');
      return `${bp}:${colMap[num] || ''}`;
    }
    return colMap[c] || '';
  }).filter(Boolean).join(' ');

  return (
    <div className={`grid ${colClasses} ${gapMap[gap] || 'gap-4'} ${className}`}>
      {children}
    </div>
  );
}

// --- Mobile Bottom Nav (for small screens) ---
export function MobileBottomNav({ items, active, onChange }: {
  items: { id: string; label: string; icon: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors min-w-[56px] ${
              active === item.id ? 'text-teal-600' : 'text-gray-400'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
