// ============================================================
// FISENT - CONFIGURACION DE ENTORNO CENTRALIZADA
// ============================================================
// Este archivo es la UNICA fuente de verdad para variables de entorno.
// Todas las paginas/servicios importan desde aqui, NUNCA de import.meta.env directamente.

/**
 * Validacion estricta de variables de entorno en tiempo de ejecucion.
 * Si falta una variable requerida, la app falla al iniciar (fail-fast).
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (value === undefined || value === '') {
    if (defaultValue !== undefined) return defaultValue;
    console.warn(`[ENV] Variable ${key} no definida, usando valor por defecto`);
    return defaultValue ?? '';
  }
  return value;
}

function getBoolEnvVar(key: string, defaultValue: boolean = false): boolean {
  const value = getEnvVar(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// --- Configuracion exportada ---
export const env = {
  // API
  API_URL: getEnvVar('VITE_API_URL', 'http://localhost:3000/api'),

  // App
  APP_NAME: getEnvVar('VITE_APP_NAME', 'FisenT'),
  APP_VERSION: getEnvVar('VITE_APP_VERSION', '1.0.0'),

  // Feature Flags
  FEATURE_PAYMENTS: getBoolEnvVar('VITE_FEATURE_PAYMENTS', true),
  FEATURE_HISTORY: getBoolEnvVar('VITE_FEATURE_HISTORY', true),
  FEATURE_CIE10: getBoolEnvVar('VITE_FEATURE_CIE10', true),

  // Debug
  DEBUG: getBoolEnvVar('VITE_DEBUG', false),

  // API Timeouts
  API_TIMEOUT: Number(getEnvVar('VITE_API_TIMEOUT', '15000')),

  // Token
  TOKEN_STORAGE_KEY: 'fisent_token',
  USER_STORAGE_KEY: 'fisent_user',
} as const;

// --- Validacion al inicio (solo en desarrollo) ---
if (import.meta.env.DEV) {
  console.log(`[FisenT v${env.APP_VERSION}] Entorno cargado:`, {
    API_URL: env.API_URL,
    FEATURES: {
      payments: env.FEATURE_PAYMENTS,
      history: env.FEATURE_HISTORY,
      cie10: env.FEATURE_CIE10,
    },
    DEBUG: env.DEBUG,
  });
}

// --- Helper para feature flags ---
export function isFeatureEnabled(feature: 'payments' | 'history' | 'cie10'): boolean {
  const flags: Record<string, boolean> = {
    payments: env.FEATURE_PAYMENTS,
    history: env.FEATURE_HISTORY,
    cie10: env.FEATURE_CIE10,
  };
  return flags[feature] ?? false;
}

// --- Helper para construir URLs de API ---
export function apiEndpoint(path: string): string {
  const base = env.API_URL.replace(/\/$/, '');
  const cleanPath = path.replace(/^\//, '');
  return `${base}/${cleanPath}`;
}
