import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'nossa-orbita-theme';

export const THEMES = [
  { key: 'dourado', label: 'Dourado', swatch: '#F4C95D' },
  { key: 'azul', label: 'Azul', swatch: '#4FC3F7' },
  { key: 'preto', label: 'Preto', swatch: '#D9B24C' },
  { key: 'vermelho', label: 'Vermelho', swatch: '#FF8A93' },
  { key: 'verde', label: 'Verde', swatch: '#6FCF97' },
  { key: 'branco', label: 'Branco', swatch: '#C99A2E' }
];

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

// Tema é preferência de aparelho (cada pessoa pode escolher a sua própria cor),
// não é sincronizado entre o casal — fica salvo só no navegador de cada um.
export function useTheme() {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dourado');

  useEffect(() => { apply(theme); }, [theme]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return { theme, setTheme };
}
