import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'dark';
  });

  const [theme, setTheme] = useState<Theme>(() => resolveTheme(
    (localStorage.getItem('themeMode') as ThemeMode) || 'dark'
  ));

  useEffect(() => {
    if (themeMode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      const handler = (e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'light' : 'dark');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [themeMode]);

  useEffect(() => {
    const resolved = resolveTheme(themeMode);
    setTheme(resolved);
    localStorage.setItem('themeMode', themeMode);
    localStorage.setItem('theme', resolved);
    document.documentElement.setAttribute('data-theme', resolved);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeModeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
