export type MarketCategory = 'Volatility' | 'Volatility 1s' | 'Jump';

export interface VolatilityMarket {
  symbol: string;
  name: string;
  pipSize: number;
  category: MarketCategory;
}

export const VOLATILITY_MARKETS: VolatilityMarket[] = [
  { symbol: 'R_10', name: 'Vol 10', pipSize: 3, category: 'Volatility' },
  { symbol: 'R_25', name: 'Vol 25', pipSize: 3, category: 'Volatility' },
  { symbol: 'R_50', name: 'Vol 50', pipSize: 4, category: 'Volatility' },
  { symbol: 'R_75', name: 'Vol 75', pipSize: 4, category: 'Volatility' },
  { symbol: 'R_100', name: 'Vol 100', pipSize: 2, category: 'Volatility' },
  { symbol: '1HZ10V', name: 'V10 1s', pipSize: 2, category: 'Volatility 1s' },
  { symbol: '1HZ25V', name: 'V25 1s', pipSize: 2, category: 'Volatility 1s' },
  { symbol: '1HZ50V', name: 'V50 1s', pipSize: 2, category: 'Volatility 1s' },
  { symbol: '1HZ75V', name: 'V75 1s', pipSize: 2, category: 'Volatility 1s' },
  { symbol: '1HZ100V', name: 'V100 1s', pipSize: 2, category: 'Volatility 1s' },
  { symbol: 'JD10', name: 'Jump 10', pipSize: 2, category: 'Jump' },
  { symbol: 'JD25', name: 'Jump 25', pipSize: 2, category: 'Jump' },
  { symbol: 'JD50', name: 'Jump 50', pipSize: 2, category: 'Jump' },
  { symbol: 'JD75', name: 'Jump 75', pipSize: 2, category: 'Jump' },
  { symbol: 'JD100', name: 'Jump 100', pipSize: 2, category: 'Jump' },
];

export type ThemePresetId =
  | 'orange'
  | 'emerald'
  | 'royal'
  | 'crimson'
  | 'purple'
  | 'cyber'
  | 'gold'
  | 'mono';

export interface ThemePreset {
  id: ThemePresetId;
  label: string;
  accent: string;
  accentSecondary: string;
  accentGlow: string;
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'orange',
    label: 'Amber',
    accent: '#ff8800',
    accentSecondary: '#cc5500',
    accentGlow: '#ffd966',
    bgCanvas: '#080a0f',
    bgSurface: '#10131b',
    bgElevated: '#161b26',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    accent: '#00c97b',
    accentSecondary: '#008a54',
    accentGlow: '#7dffb8',
    bgCanvas: '#060d0a',
    bgSurface: '#0c1712',
    bgElevated: '#12221b',
  },
  {
    id: 'royal',
    label: 'Royal',
    accent: '#3d7bff',
    accentSecondary: '#2550cc',
    accentGlow: '#b3c7ff',
    bgCanvas: '#060914',
    bgSurface: '#0d1326',
    bgElevated: '#131b34',
  },
  {
    id: 'crimson',
    label: 'Crimson',
    accent: '#ff4757',
    accentSecondary: '#c0392b',
    accentGlow: '#ffb3c1',
    bgCanvas: '#110608',
    bgSurface: '#1c0b0f',
    bgElevated: '#261016',
  },
  {
    id: 'purple',
    label: 'Violet',
    accent: '#a855f7',
    accentSecondary: '#7e22ce',
    accentGlow: '#d8b4fe',
    bgCanvas: '#0b0612',
    bgSurface: '#140c21',
    bgElevated: '#1d1230',
  },
  {
    id: 'cyber',
    label: 'Cyan',
    accent: '#00d2eb',
    accentSecondary: '#008fa3',
    accentGlow: '#a3f7ff',
    bgCanvas: '#060e12',
    bgSurface: '#0b1820',
    bgElevated: '#11222d',
  },
  {
    id: 'gold',
    label: 'Gold',
    accent: '#eab308',
    accentSecondary: '#a16207',
    accentGlow: '#fef08a',
    bgCanvas: '#0e0c07',
    bgSurface: '#18140b',
    bgElevated: '#221c10',
  },
  {
    id: 'mono',
    label: 'Slate',
    accent: '#e2e8f0',
    accentSecondary: '#94a3b8',
    accentGlow: '#f8fafc',
    bgCanvas: '#09090b',
    bgSurface: '#121216',
    bgElevated: '#1a1a20',
  },
];

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';
export type TickDirection = 'up' | 'down' | 'neutral';

export interface TickRecord {
  id: number;
  symbol: string;
  quote: number;
  quoteFormatted: string;
  digit: number;
  direction: TickDirection;
  timestamp: number;
}
