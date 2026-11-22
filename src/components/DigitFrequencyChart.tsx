import React from 'react';

interface DigitFrequencyChartProps {
  digits: number[];
  highlightedDigit?: number | null;
  title?: string;
}

export const DigitFrequencyChart: React.FC<DigitFrequencyChartProps> = ({
  digits,
  highlightedDigit = null,
  title = 'Digit Frequency Distribution (0–9)',
}) => {
  const counts = Array(10).fill(0);
  digits.forEach((d) => {
    if (d >= 0 && d <= 9) counts[d] += 1;
  });

  const total = digits.length || 1;
  const maxCount = Math.max(...counts, 1);

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-display text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          Sample: {digits.length} ticks
        </span>
      </div>

      <div className="grid grid-cols-10 items-end gap-2 sm:gap-3 h-40 pt-6">
        {counts.map((count, digit) => {
          const pct = Math.round((count / total) * 100);
          const heightPct = digits.length === 0 ? 6 : Math.max(8, Math.round((count / maxCount) * 100));
          const isHighlighted = highlightedDigit === digit;

          return (
            <div key={digit} className="flex h-full flex-col items-center justify-end gap-1.5">
              <span
                className="font-mono text-[11px] tabular-nums"
                style={{ color: isHighlighted ? 'var(--accent-glow)' : 'var(--text-secondary)' }}
              >
                {digits.length > 0 ? `${pct}%` : '0%'}
              </span>
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-full max-w-[34px] rounded-t-md transition-all duration-200"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: isHighlighted ? 'var(--accent)' : 'rgba(255, 255, 255, 0.14)',
                    boxShadow: isHighlighted ? '0 0 14px var(--accent-soft)' : 'none',
                  }}
                  title={`Digit ${digit}: ${count} hits (${pct}%)`}
                />
              </div>
              <div className="flex flex-col items-center">
                <span
                  className="font-mono text-xs font-bold tabular-nums"
                  style={{ color: isHighlighted ? 'var(--accent)' : 'var(--text-primary)' }}
                >
                  {digit}
                </span>
                <span className="font-mono text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                  {count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
