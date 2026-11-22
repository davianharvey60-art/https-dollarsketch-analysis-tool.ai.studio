import React, { useMemo } from 'react';
import { Play, Square, ArrowRight, Activity } from 'lucide-react';
import { ConnectionStatus, TickRecord, VOLATILITY_MARKETS } from '../types/trading';
import { DigitFrequencyChart } from './DigitFrequencyChart';

interface ClassicAnalysisProps {
  selectedSymbol: string;
  isStreaming: boolean;
  wsStatus: ConnectionStatus;
  ticks: TickRecord[];
  onChangeSymbol: (symbol: string) => void;
  onStartStream: () => void;
  onStopStream: () => void;
  onOpenDeepSeek: () => void;
}

interface ModelPrediction {
  name: string;
  strategy: string;
  digit: number;
  confidence: number;
}

const MARKET_CATEGORIES = ['Volatility', 'Volatility 1s', 'Jump'] as const;

export const ClassicAnalysis: React.FC<ClassicAnalysisProps> = ({
  selectedSymbol,
  isStreaming,
  wsStatus,
  ticks,
  onChangeSymbol,
  onStartStream,
  onStopStream,
  onOpenDeepSeek,
}) => {
  const market = useMemo(
    () => VOLATILITY_MARKETS.find((m) => m.symbol === selectedSymbol) || VOLATILITY_MARKETS[4],
    [selectedSymbol]
  );

  const digits = useMemo(() => ticks.map((t) => t.digit), [ticks]);
  const latestTick = ticks[0] || null;

  const { predictions, consensusDigit } = useMemo<{
    predictions: ModelPrediction[];
    consensusDigit: number | null;
  }>(() => {
    if (digits.length === 0) {
      return {
        predictions: [
          { name: 'SketchRoyal', strategy: 'Frequency Leader', digit: 0, confidence: 0 },
          { name: 'DollarEdge', strategy: 'Recency Bias', digit: 0, confidence: 0 },
          { name: 'LightningML', strategy: 'Transition Next', digit: 0, confidence: 0 },
          { name: 'EnsembleAI', strategy: 'Weighted Consensus', digit: 0, confidence: 0 },
        ],
        consensusDigit: null,
      };
    }

    const freq = Array(10).fill(0);
    digits.forEach((d) => {
      freq[d] += 1;
    });
    const maxFreq = Math.max(...freq);
    const freqLeader = freq.indexOf(maxFreq);
    const freqConf = Math.min(96, Math.round(52 + (maxFreq / digits.length) * 100 * 0.9));

    // Recency-weighted score over the last 8 ticks
    const recentScores = Array(10).fill(0);
    const recentSlice = digits.slice(0, 8);
    recentSlice.forEach((d, idx) => {
      recentScores[d] += recentSlice.length - idx;
    });
    const maxRecent = Math.max(...recentScores);
    const recentLeader = recentScores.indexOf(maxRecent);
    const recentTotalWeight = (recentSlice.length * (recentSlice.length + 1)) / 2 || 1;
    const recentConf = Math.min(95, Math.round(54 + (maxRecent / recentTotalWeight) * 100 * 0.85));

    // Transition score: what followed the latest digit previously in history
    const latestDigit = digits[0];
    const transitionCounts = Array(10).fill(0);
    let transitionHits = 0;
    for (let i = 1; i < digits.length; i++) {
      if (digits[i] === latestDigit) {
        const nextD = digits[i - 1];
        transitionCounts[nextD] += 1;
        transitionHits += 1;
      }
    }
    const maxTrans = Math.max(...transitionCounts);
    const transLeader = maxTrans > 0 ? transitionCounts.indexOf(maxTrans) : (latestDigit + 1) % 10;
    const transConf =
      transitionHits > 0
        ? Math.min(94, Math.round(55 + (maxTrans / transitionHits) * 40))
        : 60;

    // Ensemble weighted vote
    const ensembleScores = Array(10).fill(0);
    ensembleScores[freqLeader] += freqConf * 0.4;
    ensembleScores[recentLeader] += recentConf * 0.35;
    ensembleScores[transLeader] += transConf * 0.25;
    const ensembleLeader = ensembleScores.indexOf(Math.max(...ensembleScores));
    const ensembleConf = Math.min(
      97,
      Math.round(freqConf * 0.4 + recentConf * 0.35 + transConf * 0.25 + (digits.length >= 15 ? 4 : 0))
    );

    return {
      predictions: [
        { name: 'SketchRoyal', strategy: 'Frequency Leader', digit: freqLeader, confidence: freqConf },
        { name: 'DollarEdge', strategy: 'Recency Bias', digit: recentLeader, confidence: recentConf },
        { name: 'LightningML', strategy: 'Transition Next', digit: transLeader, confidence: transConf },
        { name: 'EnsembleAI', strategy: 'Weighted Consensus', digit: ensembleLeader, confidence: ensembleConf },
      ],
      consensusDigit: ensembleLeader,
    };
  }, [digits]);

  return (
    <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
      {/* Control & Workspace Header */}
      <section
        className="flex flex-col gap-4 rounded-2xl border p-5 lg:flex-row lg:items-center lg:justify-between"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            <span>{market.name} ({market.symbol})</span>
            <span aria-hidden="true">·</span>
            <span>{market.category} Index</span>
          </div>
          <h1 className="mt-1 font-display text-xl font-bold sm:text-2xl" style={{ color: 'var(--text-primary)' }}>
            Classic Digit Analysis
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="classic-market-select" className="sr-only">
            Select Market Index
          </label>
          <select
            id="classic-market-select"
            value={selectedSymbol}
            onChange={(e) => onChangeSymbol(e.target.value)}
            className="h-9 rounded-lg border px-3 text-xs font-medium outline-none cursor-pointer bg-[#161b26] text-white"
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

          {!isStreaming ? (
            <button
              type="button"
              onClick={onStartStream}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#16c784] px-4 text-xs font-semibold text-[#05140d] whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5" />
              Start Stream
            </button>
          ) : (
            <button
              type="button"
              onClick={onStopStream}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ea3943] px-4 text-xs font-semibold text-white whitespace-nowrap shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
              Stop Stream
            </button>
          )}

          <button
            type="button"
            onClick={onOpenDeepSeek}
            className="inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            DeepSeek AI Analysis
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* Live Digit Flow */}
      <section
        className="rounded-xl border p-5"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Live Digit Flow (Last 20 Ticks)
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span style={{ color: 'var(--text-secondary)' }}>
              Quote:{' '}
              <strong className="font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {latestTick ? latestTick.quoteFormatted : '—'}
              </strong>
            </span>
            <span
              className="font-medium"
              style={{
                color: isStreaming && wsStatus === 'connected' ? 'var(--tick-up)' : 'var(--text-secondary)',
              }}
            >
              {isStreaming ? (wsStatus === 'connected' ? 'Streaming' : 'Connecting...') : 'Paused'}
            </span>
          </div>
        </div>

        {ticks.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {isStreaming ? `Waiting for live ${market.name} ticks...` : 'Stream is currently paused'}
            </p>
            <p className="mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {isStreaming
                ? 'Incoming digits will populate automatically as Deriv ticks arrive.'
                : 'Press Start Stream to resume real-time digit collection.'}
            </p>
            {!isStreaming && (
              <button
                type="button"
                onClick={onStartStream}
                className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-black cursor-pointer"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Play className="h-3.5 w-3.5" />
                Start Stream
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-10">
            {ticks.map((tick, idx) => {
              const isNewest = idx === 0;
              return (
                <div
                  key={tick.id}
                  className={`flex h-12 flex-col items-center justify-center rounded-lg border font-mono tabular-nums transition-transform ${
                    isNewest ? 'animate-tick-flash' : ''
                  }`}
                  style={{
                    backgroundColor: isNewest ? 'var(--accent)' : 'var(--bg-elevated)',
                    borderColor: isNewest ? 'var(--accent-glow)' : 'var(--border-subtle)',
                    color: isNewest ? '#080a0f' : 'var(--text-primary)',
                  }}
                  title={`Quote: ${tick.quoteFormatted}`}
                >
                  <span className="text-base font-bold leading-none">{tick.digit}</span>
                  <span className="mt-0.5 text-[10px] opacity-75">
                    {isNewest ? 'NOW' : `-${idx}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Ensemble Predictions Grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {predictions.map((pred) => {
          const isConsensus = pred.name === 'EnsembleAI';
          return (
            <div
              key={pred.name}
              className="rounded-xl border p-5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: isConsensus && digits.length > 0 ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {pred.name}
                </h3>
                <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                  {pred.strategy}
                </span>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="font-mono text-3xl font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
                  {digits.length > 0 ? pred.digit : '—'}
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {digits.length > 0 ? `${pred.confidence}%` : '0%'}
                </span>
              </div>

              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${digits.length > 0 ? pred.confidence : 0}%`,
                    backgroundColor: 'var(--accent)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* Frequency Chart */}
      <DigitFrequencyChart
        digits={digits}
        highlightedDigit={consensusDigit}
        title={`${market.name} Digit Frequency (0–9)`}
      />
    </main>
  );
};
