import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Pipette } from 'lucide-react';
import { ConnectionStatus, THEME_PRESETS, ThemePresetId } from '../types/trading';

export type WorkspaceView = 'classic' | 'deepseek';

interface HeaderProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  wsStatus: ConnectionStatus;
  activeTheme: string;
  customColor: string;
  onSelectPreset: (id: ThemePresetId) => void;
  onSelectCustomColor: (hex: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  wsStatus,
  activeTheme,
  customColor,
  onSelectPreset,
  onSelectCustomColor,
}) => {
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const statusMeta =
    wsStatus === 'connected'
      ? { label: 'Live Feed', color: 'text-[#16c784]', dot: 'bg-[#16c784]' }
      : wsStatus === 'connecting'
      ? { label: 'Connecting', color: 'text-[#f5b942]', dot: 'bg-[#f5b942] animate-pulse' }
      : { label: 'Offline', color: 'text-[#ea3943]', dot: 'bg-[#ea3943]' };

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(8, 10, 15, 0.9)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('classic');
          }}
          className="font-display text-xl font-bold tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4"
          style={{ color: 'var(--text-primary)' }}
        >
          Dollar<span style={{ color: 'var(--accent)' }}>Sketch</span>
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            type="button"
            onClick={() => onSelectView('classic')}
            className="whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2"
            style={{
              color: activeView === 'classic' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderColor: activeView === 'classic' ? 'var(--accent)' : 'transparent',
            }}
          >
            Classic Analysis
          </button>
          <button
            type="button"
            onClick={() => onSelectView('deepseek')}
            className="whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer border-b-2"
            style={{
              color: activeView === 'deepseek' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderColor: activeView === 'deepseek' ? 'var(--accent)' : 'transparent',
            }}
          >
            DeepSeek Quantum
          </button>
        </nav>

        {/* Zone 3: Real WebSocket status, theme selector, and 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`hidden sm:flex items-center gap-2 text-xs font-medium whitespace-nowrap shrink-0 ${statusMeta.color}`}
            aria-live="polite"
            title="Deriv WebSocket Stream Status"
          >
            <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            <span>{statusMeta.label}</span>
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen((prev) => !prev)}
              aria-label="Choose color theme"
              aria-expanded={themeMenuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-lg border transition-colors cursor-pointer focus-visible:outline-2"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: themeMenuOpen ? 'var(--accent)' : 'var(--border-subtle)',
                color: 'var(--accent)',
              }}
            >
              <Palette className="h-4 w-4" />
            </button>

            {themeMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-xl border p-4 shadow-2xl z-50"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                    Terminal Theme
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                    {activeTheme.startsWith('custom:') ? customColor.toUpperCase() : activeTheme}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = activeTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          onSelectPreset(preset.id);
                          setThemeMenuOpen(false);
                        }}
                        title={preset.label}
                        className="relative flex h-10 w-full items-center justify-center rounded-lg border transition-transform hover:scale-105 cursor-pointer"
                        style={{
                          background: `linear-gradient(135deg, ${preset.accent}, ${preset.accentSecondary})`,
                          borderColor: isSelected ? '#ffffff' : 'transparent',
                        }}
                      >
                        {isSelected && <Check className="h-4 w-4 text-black drop-shadow" />}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="mt-3 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <label
                    htmlFor="custom-accent-picker"
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Pipette className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} />
                    Custom Accent
                  </label>
                  <input
                    id="custom-accent-picker"
                    type="color"
                    value={customColor}
                    onChange={(e) => onSelectCustomColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border bg-transparent p-0.5"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onSelectView(activeView === 'classic' ? 'deepseek' : 'classic')}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-black whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {activeView === 'classic' ? 'DeepSeek AI' : 'Classic View'}
          </button>
        </div>
      </div>

      {/* Mobile workspace switcher */}
      <div
        className="flex md:hidden border-t px-4 py-2 gap-2"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <button
          type="button"
          onClick={() => onSelectView('classic')}
          className="flex-1 rounded-md py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: activeView === 'classic' ? 'var(--accent)' : 'var(--bg-surface)',
            color: activeView === 'classic' ? '#080a0f' : 'var(--text-secondary)',
          }}
        >
          Classic Vol 100
        </button>
        <button
          type="button"
          onClick={() => onSelectView('deepseek')}
          className="flex-1 rounded-md py-1.5 text-xs font-semibold whitespace-nowrap transition-colors"
          style={{
            backgroundColor: activeView === 'deepseek' ? 'var(--accent)' : 'var(--bg-surface)',
            color: activeView === 'deepseek' ? '#080a0f' : 'var(--text-secondary)',
          }}
        >
          DeepSeek Quantum
        </button>
      </div>
    </header>
  );
};
