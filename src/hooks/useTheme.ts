import { useState, useEffect, useCallback } from 'react';
import { THEME_PRESETS, ThemePresetId } from '../types/trading';

const STORAGE_KEY = 'dollarsketch-theme-v2';

function darkenHex(hex: string, factor = 0.72): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#cc5500';
  const r = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(0, 2), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(2, 4), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(clean.slice(4, 6), 16) * factor)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lightenHex(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffd966';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const lr = Math.min(255, Math.round(r + (255 - r) * amount));
  const lg = Math.min(255, Math.round(g + (255 - g) * amount));
  const lb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(255, 136, 0, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function useTheme() {
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'orange';
    } catch {
      return 'orange';
    }
  });

  const [customColor, setCustomColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || '';
      if (saved.startsWith('custom:')) return saved.slice(7);
    } catch {
      // ignore storage access issues
    }
    return '#ff8800';
  });

  const applyCssVariables = useCallback((themeValue: string) => {
    const root = document.documentElement;
    if (themeValue.startsWith('custom:')) {
      const hex = themeValue.slice(7);
      root.style.setProperty('--accent', hex);
      root.style.setProperty('--accent-secondary', darkenHex(hex));
      root.style.setProperty('--accent-glow', lightenHex(hex));
      root.style.setProperty('--accent-soft', hexToRgba(hex, 0.14));
      root.style.setProperty('--bg-canvas', '#080a0f');
      root.style.setProperty('--bg-surface', '#10131b');
      root.style.setProperty('--bg-elevated', '#161b26');
      return;
    }

    const preset = THEME_PRESETS.find((p) => p.id === (themeValue as ThemePresetId)) || THEME_PRESETS[0];
    root.style.setProperty('--accent', preset.accent);
    root.style.setProperty('--accent-secondary', preset.accentSecondary);
    root.style.setProperty('--accent-glow', preset.accentGlow);
    root.style.setProperty('--accent-soft', hexToRgba(preset.accent, 0.14));
    root.style.setProperty('--bg-canvas', preset.bgCanvas);
    root.style.setProperty('--bg-surface', preset.bgSurface);
    root.style.setProperty('--bg-elevated', preset.bgElevated);
  }, []);

  useEffect(() => {
    applyCssVariables(activeTheme);
    try {
      localStorage.setItem(STORAGE_KEY, activeTheme);
    } catch {
      // ignore
    }
  }, [activeTheme, applyCssVariables]);

  const selectPreset = useCallback((id: ThemePresetId) => {
    setActiveTheme(id);
  }, []);

  const selectCustomColor = useCallback((hex: string) => {
    setCustomColor(hex);
    setActiveTheme(`custom:${hex}`);
  }, []);

  return {
    activeTheme,
    customColor,
    selectPreset,
    selectCustomColor,
  };
}
