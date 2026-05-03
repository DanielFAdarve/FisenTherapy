// ============================================================
// FISENT - API CLIENT (Axios instance + interceptors)
// ============================================================
import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { BackendResponse } from '../domain/models';
import { env } from '../config/env';

// --- Configuracion base ---
const api = axios.create({
  baseURL: env.API_URL,
  timeout: env.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// --- Interceptor de Request (JWT) ---
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Interceptor de Response (normalizacion + errores) ---
api.interceptors.response.use(
  (response: AxiosResponse<BackendResponse>) => {
    // Normalizar: si HTTP 200 pero body.status >= 400, tratar como error
    if (response.data && typeof response.data.status === 'number' && response.data.status >= 400) {
      return Promise.reject({
        isBackendError: true,
        status: response.data.status,
        message: response.data.message || 'Error del servidor',
        response: response.data,
      });
    }
    return response;
  },
  (error: AxiosError<BackendResponse> | any) => {
    // Caso: HTTP 400 con status interno 500 en body
    if (error.response?.data) {
      const body = error.response.data;
      const normalizedError = {
        status: body.status || error.response.status,
        message: body.message || error.message,
        httpStatus: error.response.status,
        isBackendError: true,
      };

      // 401: Token no proporcionado -> logout
      if (error.response.status === 401 || normalizedError.status === 401) {
        handleAuthError();
      }
      // 403: Token invalido -> logout
      if (error.response.status === 403 || normalizedError.status === 403) {
        handleAuthError();
      }

      return Promise.reject(normalizedError);
    }

    // Network error
    if (!error.response) {
      return Promise.reject({
        status: 0,
        message: 'Error de conexion. Verifique su red.',
        isNetworkError: true,
      });
    }

    return Promise.reject({
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Error desconocido',
      isBackendError: true,
    });
  }
);

// --- Token Management ---
// ESTRATEGIA: Almacenamiento en memoria (mas seguro que localStorage)
// Fallback: sessionStorage para persistencia entre recargas
let _authToken: string | null = null;

export function setAuthToken(token: string): void {
  _authToken = token;
  try {
    sessionStorage.setItem(env.TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage no disponible (modo privado)
  }
}

export function getAuthToken(): string | null {
  if (_authToken) return _authToken;
  try {
    const stored = sessionStorage.getItem(env.TOKEN_STORAGE_KEY);
    if (stored) {
      _authToken = stored;
      return stored;
    }
  } catch {
    // Storage no disponible
  }
  return null;
}

export function removeAuthToken(): void {
  _authToken = null;
  try {
    sessionStorage.removeItem(env.TOKEN_STORAGE_KEY);
  } catch {
    // noop
  }
}

export function isAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  // Verificar expiracion del JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      removeAuthToken();
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getTokenExpirySeconds(): number {
  const token = getAuthToken();
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp ? payload.exp - now : 0;
  } catch {
    return 0;
  }
}

function handleAuthError(): void {
  removeAuthToken();
  window.location.href = '/login';
}

export default api;
