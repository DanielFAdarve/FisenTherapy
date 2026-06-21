// ============================================================
// FISENT - LAYOUT (Responsive + Mobile Optimized)
// ============================================================
import { useState, ReactNode } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Users, Package, Calendar, FileText, BookOpen, CreditCard, Stethoscope,
  LogOut, Menu, ChevronLeft, Activity, Home, BarChart3, CalendarDays, X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isAuthenticated as checkAuth } from '../../data-access/api';
import { env } from '../../config/env';
import { isFeatureEnabled } from '../../config/env';

// --- Auth Guard ---
export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!checkAuth()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  if (checkAuth()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// --- Navigation Items ---
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Home, shortLabel: 'Inicio' },
  { path: '/calendar', label: 'Calendario', icon: CalendarDays, shortLabel: 'Agenda' },
  { path: '/patients', label: 'Pacientes', icon: Users, shortLabel: 'Pacientes' },
  { path: '/packages', label: 'Paquetes', icon: Package, shortLabel: 'Paquetes' },
  { path: '/appointments', label: 'Citas', icon: Calendar, shortLabel: 'Citas' },
  { path: '/history', label: 'Historia Clinica', icon: FileText, shortLabel: 'Historia', feature: 'history' as const },
  { path: '/payments', label: 'Pagos', icon: CreditCard, shortLabel: 'Pagos', feature: 'payments' as const },
  { path: '/reports', label: 'Reportes', icon: BarChart3, shortLabel: 'Reportes' },
  { path: '/professionals', label: 'Profesionales', icon: Stethoscope, shortLabel: 'Profs' },
  { path: '/cie10', label: 'CIE10', icon: BookOpen, shortLabel: 'CIE10', feature: 'cie10' as const },
].filter(item => !item.feature || isFeatureEnabled(item.feature));

// Mobile bottom nav items (top 5)
const mobileNavItems = navItems.slice(0, 5);

// --- Layout ---
export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { state, logout } = useAuth();
  const navigate = useNavigate(); 

  const handleLogout = () => {
    logout(); // Esto elimina el token
    navigate('/login', { replace: true }); // Redirección inmediata
  };

  const currentNav = navItems.find((n) => location.pathname === n.path || location.pathname.startsWith(n.path + '/'));

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <nav className="flex flex-col h-full" role="navigation" aria-label="Navegacion principal">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img 
  src="/logo.png" 
  alt="FisenCare Logo" 
  className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-teal-500/20"
/>
          {(sidebarOpen || mobile) && (
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">{env.APP_NAME}</h1>
              <p className="text-[10px] text-teal-300/60 font-medium uppercase tracking-widest">v{env.APP_VERSION}</p>
            </div>
          )}
        </div>
        {mobile && (
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-black/10 text-black/60" aria-label="Cerrar menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav Items */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                  ? 'bg-white/15 text-white shadow-lg shadow-black/10'
                  : 'text-teal-100/60 hover:bg-white/10 hover:text-white'
                }`}
              onClick={() => { if (mobile) setMobileOpen(false); }}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {(sidebarOpen || mobile) && <span>{item.label}</span>}
              {isActive && (sidebarOpen || mobile) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-300" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 ${sidebarOpen || mobile ? '' : 'justify-center'}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
            {state.user?.nombre?.charAt(0) || state.user?.username?.charAt(0) || 'U'}
          </div>
          {(sidebarOpen || mobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{state.user?.nombre || state.user?.username}</p>
              <p className="text-[11px] text-teal-300/50 truncate">{state.user?.rol || 'Usuario'}</p>
            </div>
          )}
          {(sidebarOpen || mobile) && (
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/10 text-teal-200/60 hover:text-white transition-colors" aria-label="Cerrar sesion">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen bg-gray-50/80 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-gradient-to-b from-slate-900 via-teal-900 to-slate-900 transition-all duration-300 ease-in-out flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile/Tablet Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-slate-900 via-teal-900 to-slate-900 z-50 shadow-2xl animate-slide-in-left">
            <SidebarContent mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-3 md:px-4 lg:px-6 py-2.5 md:py-3 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) setSidebarOpen(!sidebarOpen);
                else setMobileOpen(true);
              }}
              className="p-2 rounded-xl color-red hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Menu"
            >
              {sidebarOpen ? <ChevronLeft className="w-5 h-5  lg:block" /> : <Menu className="w-5 h-5" />}
            </button>
            <h2 className="text-sm font-bold text-gray-800 truncate max-w-[200px] md:max-w-none">
              {currentNav?.label || env.APP_NAME}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                {state.user?.nombre?.charAt(0) || state.user?.username?.charAt(0) || 'U'}
              </div>
              <span className="text-xs font-semibold text-gray-600 hidden lg:inline">{state.user?.nombre || state.user?.username}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Cerrar sesion">
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 xl:p-8 pb-20 sm:pb-4 md:pb-6 lg:pb-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 z-40 lg:hidden safe-area-bottom" aria-label="Navegacion movil">
        <div className="flex items-center justify-around py-1.5 px-2">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[52px] ${isActive ? 'text-teal-600 bg-teal-50' : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
