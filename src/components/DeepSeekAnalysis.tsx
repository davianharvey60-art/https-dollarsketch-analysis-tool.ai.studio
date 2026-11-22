import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Play, ArrowLeft, Check } from 'lucide-react';
import { ConnectionStatus, TickRecord, VOLATILITY_MARKETS } from '../types/trading';
import { DigitFrequencyChart } from './DigitFrequencyChart';

interface DeepSeekAnalysisProps {
  selectedSymbol: string;
  ticks: TickRecord[];
  wsStatus: ConnectionStatus;
  onChangeSymbol: (symbol: string) => void;
  onResync: () => void;
  onBackToClassic: () => void;
  onNotify: (msg: string) => void;
}

const ANALYSIS_STEPS = [
  { id: 1, label: 'Data', detail: 'Collecting real-time tick data from D-Circles...' },
  { id: 2, label: 'Pattern', detail: 'Analyzing tick direction patterns and volatility...' },
  { id: 3, label: 'Neural', detail: 'DeepSeek neural engine evaluating digit sequences...' },
  { id: 4, label: 'Calibrate', detail: 'Calculating confidence based on tick momentum...' },
  { id: 5, label: 'Finalize', detail: 'Finalizing calibrated prediction output...' },
];

const MARKET_CATEGORIES = ['Volatility', 'Volatility 1s', 'Jump'] as const;

export const DeepSeekAnalysis: React.FC<DeepSeekAnalysisProps> = ({
  selectedSymbol,
  ticks,
  wsStatus,
  onChangeSymbol,
  onResync,
  onBackToClassic,
  onNotify,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progressMessage, setProgressMessage] = useState('Real-time D-Circles tick indicators active');
  const timerRef = useRef<number | null>(null);

  const market = useMemo(
    () => VOLATILITY_MARKETS.find((m) => m.symbol === selectedSymbol) || VOLATILITY_MARKETS[3],
    [selectedSymbol]
  );

  const digits = useMemo(() => ticks.map((t) => t.digit), [ticks]);
  const latestTick = ticks[0] || null;

  const { probabilities, topDigit, confidence } = useMemo(() => {
    const counts = Array(10).fill(0);
    digits.forEach((d) => {
      counts[d] += 1;
    });
    const total = digits.length || 1;
    const probs = counts.map((c) => Math.round((c / total) * 100));

    if (digits.length === 0) {
      return { probabilities: probs, topDigit: null as number | null, confidence: 0 };
    }

    const maxFreq = Math.max(...counts);
    const leader = counts.indexOf(maxFreq);
    const freqStrength = (maxFreq / digits.length) * 100;
    const conf = Math.min(98, Math.round(45 + freqStrength * 0.55 + (digits.length >= 15 ? 8 : 0)));

    return { probabilities: probs, topDigit: leader, confidence: conf };
  }, [digits]);

  const latestPredictionRef = useRef<{ topDigit: number | null; confidence: number }>({
    topDigit,
    confidence,
  });

  useEffect(() => {
    latestPredictionRef.current = { topDigit, confidence };
  }, [topDigit, confidence]);

  // Cancel any in-flight analysis animation when switching markets or unmounting
  useEffect(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsAnalyzing(false);
    setCurrentStep(0);
    setCompletedSteps([]);
    setProgressMessage('Real-time D-Circles tick indicators active');
  }, [selectedSymbol]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleRunAnalysis = () => {
    if (isAnalyzing) {
      onNotify('Analysis is already running...');
      return;
    }
    if (digits.length === 0) {
      onNotify('Waiting for incoming live ticks first...');
      return;
    }

    setIsAnalyzing(true);
    setCompletedSteps([]);
    setCurrentStep(1);
    setProgressMessage(ANALYSIS_STEPS[0].detail);

    let stepIdx = 0;

    const advance = () => {
      const completedStep = ANALYSIS_STEPS[stepIdx];
      if (completedStep) {
        const completedId = completedStep.id;
        setCompletedSteps((prev) => (prev.includes(completedId) ? prev : [...prev, completedId]));
      }
      stepIdx += 1;

      if (stepIdx >= ANALYSIS_STEPS.length) {
        setCurrentStep(0);
        setIsAnalyzing(false);
        const latest = latestPredictionRef.current;
        const msg = `Analysis ready · Predicted Digit ${latest.topDigit ?? '—'} (${latest.confidence}% confidence)`;
        setProgressMessage(msg);
        onNotify(msg);
        return;
      }

      const nextStep = ANALYSIS_STEPS[stepIdx];
      if (nextStep) {
        setCurrentStep(nextStep.id);
        setProgressMessage(nextStep.detail);
      }
      timerRef.current = window.setTimeout(advance, 900);
    };

    timerRef.current = window.setTimeout(advance, 900);
  };

  return (
    <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
      {/* Toolbar */}
      <section
        className="flex flex-col gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToClassic}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Classic
          </button>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              DeepSeek Quantum Analysis
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {market.name} ({market.symbol}) · {market.category} Index · Real-time tick probability engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="volatility-market-select" className="sr-only">
            Select Market Index
          </label>
          <select
            id="volatility-market-select"
            value={selectedSymbol}
            onChange={(e) => onChangeSymbol(e.target.value)}
            className="h-10 rounded-lg border px-3 text-sm font-medium outline-none cursor-pointer bg-[#161b26] text-white"
            style={{
              borderColor: 'var(--border-subtle)',
            }}
          >
            {MARKET_CATEGORIES.map((category) => (
              <optgroup key={category} label={category} className="bg-[#10131b] text-[#9aa6bc]">
                {VOLATILITY_MARKETS.filter((m) => m.category === category).map((m) => (
                  <option key={m.symbol} value={m.symbol} className="bg-[#161b26] text-white">
                    {m.name} ({m.symbol})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <button
            type="button"
            onClick={onResync}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border px-4 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync
          </button>

          <button
            type="button"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-5 text-xs font-semibold text-black whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            <Play className="h-3.5 w-3.5" />
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </section>

      {/* 5-Stage Pipeline */}
      <section
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Analysis Pipeline
          </h2>
          <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
            {progressMessage}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {ANALYSIS_STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isDone = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className="flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: isActive
                    ? 'var(--accent)'
                    : isDone
                    ? 'rgba(22, 199, 132, 0.16)'
                    : 'var(--bg-elevated)',
                  borderColor: isActive
                    ? 'var(--accent)'
                    : isDone
                    ? 'var(--tick-up)'
                    : 'var(--border-subtle)',
                  color: isActive ? '#080a0f' : isDone ? 'var(--tick-up)' : 'var(--text-secondary)',
                }}
              >
                {isDone && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{step.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Split: D-Circles (8 cols) + Live Prediction Card (4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
        <section
          className="flex flex-col justify-between rounded-xl border p-5 lg:col-span-8"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  D-Circles Live · {market.name}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Latest Quote:{' '}
                  <span className="font-mono font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {latestTick ? latestTick.quoteFormatted : '—'}
                  </span>{' '}
                  · Status: {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span style={{ color: 'var(--tick-up)' }}>▲ Up</span>
                <span style={{ color: 'var(--tick-down)' }}>▼ Down</span>
                <span style={{ color: 'var(--tick-neutral)' }}>● Neutral</span>
              </div>
            </div>

            {/* 0-9 D-Circles Grid */}
            <div className="grid grid-cols-5 gap-3 sm:gap-4 py-2">
              {Array.from({ length: 10 }, (_, digit) => {
                const prob = probabilities[digit] || 0;
                const isTop = topDigit === digit && digits.length > 0;
                const isLatest = latestTick?.digit === digit;
                const dir = isLatest ? latestTick.direction : null;

                let ringColor = 'var(--border-subtle)';
                let dirLabel = '';
                let dirBg = '';
                if (isLatest && dir) {
                  if (dir === 'up') {
                    ringColor = 'var(--tick-up)';
                    dirLabel = '▲';
                    dirBg = 'var(--tick-up)';
                  } else if (dir === 'down') {
                    ringColor = 'var(--tick-down)';
                    dirLabel = '▼';
                    dirBg = 'var(--tick-down)';
                  } else {
                    ringColor = 'var(--tick-neutral)';
                    dirLabel = '●';
                    dirBg = 'var(--tick-neutral)';
                  }
                } else if (isTop) {
                  ringColor = 'var(--accent)';
                }

                return (
                  <div key={digit} className="flex flex-col items-center">
                    <div
                      className={`relative flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-full border-2 transition-all duration-150 ${
                        isLatest ? 'animate-tick-flash' : ''
                      }`}
                      style={{
                        backgroundColor: isTop ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        borderColor: ringColor,
                        boxShadow: isTop ? '0 0 18px var(--accent-soft)' : 'none',
                      }}
                    >
                      <span
                        className="font-mono text-xl sm:text-2xl font-bold tabular-nums leading-none"
                        style={{ color: isTop ? 'var(--accent-glow)' : 'var(--text-primary)' }}
                      >
                        {digit}
                      </span>
                      <span className="mt-1 font-mono text-[11px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {digits.length > 0 ? `${prob}%` : '0%'}
                      </span>

                      {isLatest && (
                        <span
                          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-black shadow"
                          style={{ backgroundColor: dirBg }}
                          title={`Latest digit (${dir})`}
                        >
                          {dirLabel}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Tick Stream Strip */}
          <div
            className="mt-5 flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 font-mono text-xs tabular-nums"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="font-sans font-medium" style={{ color: 'var(--text-secondary)' }}>
              Stream:
            </span>
            {ticks.length === 0 ? (
              <span style={{ color: 'var(--text-secondary)' }}>Waiting for live ticks...</span>
            ) : (
              ticks.slice(0, 12).map((t, i) => {
                const arrow = t.direction === 'up' ? '▲' : t.direction === 'down' ? '▼' : '●';
                const color =
                  t.direction === 'up'
                    ? 'var(--tick-up)'
                    : t.direction === 'down'
                    ? 'var(--tick-down)'
                    : 'var(--tick-neutral)';
                return (
                  <span key={t.id} style={{ color }} className="font-semibold">
                    {arrow}
                    {t.digit}
                    {i < Math.min(ticks.length, 12) - 1 && (
                      <span className="ml-1.5" style={{ color: 'var(--text-secondary)' }}>
                        ·
                      </span>
                    )}
                  </span>
                );
              })
            )}
          </div>
        </section>

        {/* Live Prediction Output Card */}
        <section
          className="flex flex-col justify-between rounded-xl border p-6 lg:col-span-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: topDigit !== null ? 'var(--accent)' : 'var(--border-subtle)',
          }}
        >
          <div>
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Dominant Probability Signal
            </span>
            <h2 className="mt-1 font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Live Prediction
            </h2>
          </div>

          <div
            className="my-6 flex flex-col items-center justify-center rounded-xl border py-8"
            style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Predicted Digit
            </span>
            <div className="mt-2 font-mono text-6xl font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
              {topDigit !== null ? topDigit : '—'}
            </div>
            <div className="mt-4 w-4/5">
              <div className="mb-1.5 flex justify-between font-mono text-xs tabular-nums">
                <span style={{ color: 'var(--text-secondary)' }}>Confidence</span>
                <span style={{ color: 'var(--text-primary)' }}>{confidence}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${confidence}%`,
                    backgroundColor: 'var(--accent)',
                  }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div
              className="flex items-center justify-between text-xs font-mono tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Ticks Observed</span>
              <span style={{ color: 'var(--text-primary)' }}>{ticks.length} / 25</span>
            </div>
            <div
              className="flex items-center justify-between text-xs font-mono tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>Updated</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {latestTick ? new Date(latestTick.timestamp).toLocaleTimeString() : '—'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="mt-2 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-black transition-opacity disabled:opacity-50 hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {isAnalyzing ? 'Running Neural Pass...' : 'Recalibrate Analysis'}
            </button>
          </div>
        </section>
      </div>

      {/* Recent Digit History Strip */}
      <section
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Digit History ({market.name})
          </h3>
          <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Last {Math.min(ticks.length, 16)} ticks
          </span>
        </div>

        {ticks.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Awaiting incoming ticks for {market.name}...
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {ticks.slice(0, 16).map((t, idx) => (
              <div
                key={t.id}
                className="flex h-10 w-10 items-center justify-center rounded-lg border font-mono text-sm font-bold tabular-nums"
                style={{
                  backgroundColor: idx === 0 ? 'var(--accent)' : 'var(--bg-elevated)',
                  borderColor: idx === 0 ? 'var(--accent-glow)' : 'var(--border-subtle)',
                  color: idx === 0 ? '#080a0f' : 'var(--text-primary)',
                }}
                title={`Quote: ${t.quoteFormatted}`}
              >
                {t.digit}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Market Frequency Chart */}
      <DigitFrequencyChart
        digits={digits}
        highlightedDigit={topDigit}
        title={`${market.name} Digit Frequency Distribution (0–9)`}
      />
    </main>
  );
};
