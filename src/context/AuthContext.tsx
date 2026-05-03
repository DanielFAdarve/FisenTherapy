// ============================================================
// FISENT - AUTH CONTEXT (Estado global de autenticacion)
// ============================================================
import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../domain/models';
import { authService } from '../data-access/services';
import { setAuthToken, removeAuthToken, isAuthenticated, getTokenExpirySeconds } from '../data-access/api';
import { LoginFormData } from '../domain/schemas';
import { env } from '../config/env';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: User }
  | { type: 'LOGIN_ERROR'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return { user: action.user, isAuthenticated: true, isLoading: false, error: null };
    case 'LOGIN_ERROR':
      return { ...state, isLoading: false, error: action.error };
    case 'LOGOUT':
      return initialState;
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextType {
  state: AuthState;
  login: (data: LoginFormData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar sesion al montar
  useEffect(() => {
    if (isAuthenticated()) {
      const stored = sessionStorage.getItem(env.USER_STORAGE_KEY);
      if (stored) {
        try {
          dispatch({ type: 'LOGIN_SUCCESS', user: JSON.parse(stored) });
        } catch {
          dispatch({ type: 'LOGOUT' });
        }
      }
    }
  }, []);

  // Auto-logout por expiracion de token
  useEffect(() => {
    if (!state.isAuthenticated) return;
    const checkInterval = setInterval(() => {
      if (getTokenExpirySeconds() <= 60) {
        logout();
      }
    }, 30000);
    return () => clearInterval(checkInterval);
  }, [state.isAuthenticated]);

  const login = useCallback(async (data: LoginFormData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await authService.login(data);
      setAuthToken(response.token);
      sessionStorage.setItem(env.USER_STORAGE_KEY, JSON.stringify(response.user));
      dispatch({ type: 'LOGIN_SUCCESS', user: response.user });
    } catch (err: any) {
      const message = err?.message || 'Error de autenticacion';
      dispatch({ type: 'LOGIN_ERROR', error: message });
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    removeAuthToken();
    sessionStorage.removeItem(env.USER_STORAGE_KEY);
    dispatch({ type: 'LOGOUT' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
