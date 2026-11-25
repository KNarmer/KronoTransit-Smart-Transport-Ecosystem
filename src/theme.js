import { useEffect, useState } from 'react';

// Light (warm, from the logo) and dark (cool, technical). Follows the system until the visitor picks one.
const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || (systemDark() ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  const toggle = () => setTheme((t) => {
    const n = t === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('kt-theme', n); } catch (e) { /* storage unavailable */ }
    return n;
  });
  return [theme, toggle];
}
