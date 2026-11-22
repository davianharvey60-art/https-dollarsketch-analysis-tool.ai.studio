import React, { useState, useCallback, useEffect } from 'react';
import { Header, WorkspaceView } from './components/Header';
import { ClassicAnalysis } from './components/ClassicAnalysis';
import { DeepSeekAnalysis } from './components/DeepSeekAnalysis';
import { useTheme } from './hooks/useTheme';
import { useDerivStream } from './hooks/useDerivStream';
import { TickRecord, VOLATILITY_MARKETS } from './types/trading';

const CLASSIC_MAX = 20;
const DEEPSEEK_MAX = 25;

export default function App() {
  const { activeTheme, customColor, selectPreset, selectCustomColor } = useTheme();

  const [activeView, setActiveView] = useState<WorkspaceView>('classic');
  const [classicStreaming, setClassicStreaming] = useState(true);
  const [classicSymbol, setClassicSymbol] = useState('R_100');
  const [deepseekSymbol, setDeepseekSymbol] = useState('JD75');

  const [classicTicks, setClassicTicks] = useState<TickRecord[]>([]);
  const [deepseekTicks, setDeepseekTicks] = useState<TickRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const handleTick = useCallback(
    (tick: TickRecord) => {
      if (tick.symbol === classicSymbol && activeView === 'classic' && classicStreaming) {
        setClassicTicks((prev) => [tick, ...prev].slice(0, CLASSIC_MAX));
      }
      if (tick.symbol === deepseekSymbol && activeView === 'deepseek') {
        setDeepseekTicks((prev) => [tick, ...prev].slice(0, DEEPSEEK_MAX));
      }
    },
    [classicSymbol, deepseekSymbol, activeView, classicStreaming]
  );

  const handleHistory = useCallback(
    (symbol: string, records: TickRecord[]) => {
      if (symbol === classicSymbol && activeView === 'classic' && classicStreaming) {
        setClassicTicks(records.slice(0, CLASSIC_MAX));
      }
      if (symbol === deepseekSymbol && activeView === 'deepseek') {
        setDeepseekTicks(records.slice(0, DEEPSEEK_MAX));
      }
    },
    [classicSymbol, deepseekSymbol, activeView, classicStreaming]
  );

  const { status, lastError, subscribe, unsubscribe, resync } = useDerivStream(
    handleTick,
    handleHistory
  );

  useEffect(() => {
    if (!lastError) return;
    showToast(lastError);
  }, [lastError, showToast]);

  // Cleanly manage active WebSocket subscriptions per active view
  useEffect(() => {
    if (activeView === 'classic') {
      if (classicSymbol !== deepseekSymbol) {
        unsubscribe(deepseekSymbol);
      }
      if (classicStreaming) {
        subscribe(classicSymbol);
      } else {
        unsubscribe(classicSymbol);
      }
    } else {
      if (classicSymbol !== deepseekSymbol) {
        unsubscribe(classicSymbol);
      }
      subscribe(deepseekSymbol);
    }
  }, [activeView, classicStreaming, classicSymbol, deepseekSymbol, subscribe, unsubscribe]);

  const handleSelectView = (view: WorkspaceView) => {
    setActiveView(view);
  };

  const handleChangeClassicSymbol = (newSymbol: string) => {
    if (newSymbol === classicSymbol) return;
    unsubscribe(classicSymbol);
    setClassicTicks([]);
    setClassicSymbol(newSymbol);
    if (classicStreaming) {
      subscribe(newSymbol);
    }
    const label = VOLATILITY_MARKETS.find((m) => m.symbol === newSymbol)?.name || newSymbol;
    showToast(`Switched Classic market to ${label}`);
  };

  const handleChangeDeepseekSymbol = (newSymbol: string) => {
    if (newSymbol === deepseekSymbol) return;
    unsubscribe(deepseekSymbol);
    setDeepseekTicks([]);
    setDeepseekSymbol(newSymbol);
    subscribe(newSymbol);
    const label = VOLATILITY_MARKETS.find((m) => m.symbol === newSymbol)?.name || newSymbol;
    showToast(`Switched DeepSeek market to ${label}`);
  };

  const classicMarketName =
    VOLATILITY_MARKETS.find((m) => m.symbol === classicSymbol)?.name || classicSymbol;

  return (
    <div id="top" className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-canvas)' }}>
      <Header
        activeView={activeView}
        onSelectView={handleSelectView}
        wsStatus={status}
        activeTheme={activeTheme}
        customColor={customColor}
        onSelectPreset={(id) => {
          selectPreset(id);
          showToast(`Theme updated: ${id}`);
        }}
        onSelectCustomColor={(hex) => {
          selectCustomColor(hex);
        }}
      />

      <div className="flex-1">
        {activeView === 'classic' ? (
          <ClassicAnalysis
            selectedSymbol={classicSymbol}
            isStreaming={classicStreaming}
            wsStatus={status}
            ticks={classicTicks}
            onChangeSymbol={handleChangeClassicSymbol}
            onStartStream={() => {
              setClassicStreaming(true);
              subscribe(classicSymbol);
              showToast(`${classicMarketName} stream started`);
            }}
            onStopStream={() => {
              setClassicStreaming(false);
              unsubscribe(classicSymbol);
              showToast(`${classicMarketName} stream paused`);
            }}
            onOpenDeepSeek={() => handleSelectView('deepseek')}
          />
        ) : (
          <DeepSeekAnalysis
            selectedSymbol={deepseekSymbol}
            ticks={deepseekTicks}
            wsStatus={status}
            onChangeSymbol={handleChangeDeepseekSymbol}
            onResync={() => {
              resync(deepseekSymbol);
              showToast(`Re-syncing ${deepseekSymbol}...`);
            }}
            onBackToClassic={() => handleSelectView('classic')}
            onNotify={showToast}
          />
        )}
      </div>

      <footer
        className="border-t py-5 text-center text-xs"
        style={{
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6">
          <span>DollarSketch Analysis Tool</span>
          <span>Live market data provided via Deriv Public WebSocket</span>
        </div>
      </footer>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-lg border px-4 py-2 text-xs font-semibold shadow-xl"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--accent)',
            color: 'var(--text-primary)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
