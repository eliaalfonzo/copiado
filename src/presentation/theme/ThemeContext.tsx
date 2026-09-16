import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeMode } from '@/shared/types';
import { container } from '@/infrastructure/container';

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    container.settingsRepository.getThemeMode().then((savedMode) => {
      if (mounted) {
        setModeState(savedMode);
        setLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    void container.settingsRepository.saveThemeMode(newMode);
  };

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => ({ mode, toggleMode, setMode }), [mode]);

  if (!loaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return ctx;
}