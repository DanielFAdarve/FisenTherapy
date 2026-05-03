// ============================================================
// FISENT - LOGIN PAGE (Redisenado)
// ============================================================
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginSchema, LoginFormData } from '../domain/schemas';
import { Activity, Eye, EyeOff, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, state, clearError } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<LoginFormData>({ username: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof LoginFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    clearError();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: any) => {
        const field = String(err.path[0]);
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    try {
      await login(result.data);
      toast.success('Bienvenido a FisenT');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Error de autenticacion');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          {/* <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-3xl mb-5 shadow-2xl shadow-teal-500/30">
            <Activity className="w-10 h-10 text-white" />
          </div> */}
          <div className="inline-flex items-center justify-center w-40 h-40 bg-gradient-to-br from-black-000 to-black-400 rounded-3xl mb-5 shadow-2xl shadow-black-500/30 overflow-hidden">

            <img
              src="/logo.png"
              alt="FisenT Logo"
              className="w-30 h-30 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-110"
            />

          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Fisen</h1>
          <p className="text-teal-300/70 mt-2 text-sm font-medium">Sistema de Fisioterapias</p>
        </div>




        {/* Form Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-8 border border-white/20">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Iniciar sesion</h2>
            <p className="text-sm text-gray-400 mt-1">Ingrese sus credenciales para acceder al sistema</p>
          </div>

          {state.error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2" role="alert">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {state.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  className={`w-full rounded-xl border-2 pl-10 pr-4 py-2.5 text-sm focus:outline-none transition-all duration-200 bg-white ${errors.username ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
                    }`}
                  placeholder="Ingrese su usuario"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={`w-full rounded-xl border-2 pl-10 pr-12 py-2.5 text-sm focus:outline-none transition-all duration-200 bg-white ${errors.password ? 'border-red-300 bg-red-50/50' : 'border-gray-200 focus:border-teal-500 focus:shadow-lg focus:shadow-teal-500/10'
                    }`}
                  placeholder="Ingrese su contrasena"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={state.isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 shadow-lg shadow-teal-500/25 active:scale-[0.98] flex items-center justify-center mt-6"
            >
              {state.isLoading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Ingresar al sistema'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-teal-300/40 mt-8 font-medium">
          2026 FisenT - Todos los derechos reservados
        </p>
      </div>
    </div >
  );
}
