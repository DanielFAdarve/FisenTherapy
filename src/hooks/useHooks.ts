// ============================================================
// FISENT - HOOKS (Responsive & Utilities)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { breakpoints } from '../styles/tokens';

// ============================================================
// useResponsive - Detecta breakpoint actual
// ============================================================
export function useResponsive() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    // Debounce for performance
    let timeout: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleResize, 100);
    };
    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return {
    width,
    isMobile: width < breakpoints.sm,
    isTablet: width >= breakpoints.sm && width < breakpoints.lg,
    isDesktop: width >= breakpoints.lg,
    isSm: width >= breakpoints.sm,
    isMd: width >= breakpoints.md,
    isLg: width >= breakpoints.lg,
    isXl: width >= breakpoints.xl,
  };
}

// ============================================================
// useMediaQuery - Custom media query hook
// ============================================================
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// ============================================================
// useIsMobile - Shortcut for mobile detection
// ============================================================
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${breakpoints.sm - 1}px)`);
}

// ============================================================
// useIsTablet - Shortcut for tablet detection
// ============================================================
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.lg - 1}px)`);
}

// ============================================================
// useDebounce - Debounce value
// ============================================================
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================
// useLocalStorage - Persistent state
// ============================================================
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    try {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch {
      // Storage not available
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}
