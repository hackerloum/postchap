'use client';

import { useState, useEffect, useRef } from 'react';

const brands = [
  { name: 'Safaricom', symbol: '◆' },
  { name: 'CRDB', symbol: '▲' },
  { name: 'Vodacom', symbol: '●' },
  { name: 'Azam', symbol: '◈' },
  { name: 'NMB Bank', symbol: '◇' },
  { name: 'Jubilee', symbol: '▸' },
  { name: 'DStv', symbol: '◉' },
  { name: 'Precision Air', symbol: '△' },
  { name: 'Maxcom', symbol: '◆' },
  { name: 'Tanzania Breweries', symbol: '▪' },
  { name: 'KCB', symbol: '◈' },
  { name: 'Multichoice', symbol: '●' },
  { name: 'Airtel', symbol: '▲' },
  { name: 'Equity Bank', symbol: '◇' },
  { name: 'Standard Chartered', symbol: '◉' },
  { name: 'Absa', symbol: '▸' },
];

type CellState = {
  current: number;
  next: number | null;
  isSwapping: boolean;
  isPaused: boolean;
};

const CELL_COUNT = 8;
const TRANSITION_MS = 400;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUsedBrandIndices(cellStates: CellState[], excludeCellIndex: number): Set<number> {
  const used = new Set<number>();
  cellStates.forEach((cell, i) => {
    used.add(cell.current);
    if (cell.next !== null) used.add(cell.next);
  });
  return used;
}

function pickNextBrandIndex(currentIndex: number, usedIndices: Set<number>): number {
  const candidates = brands
    .map((_, i) => i)
    .filter((i) => i !== currentIndex && !usedIndices.has(i));
  if (candidates.length === 0) return (currentIndex + 1) % brands.length;
  return candidates[getRandomInt(0, candidates.length - 1)];
}

export function LogoWall() {
  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    Array.from({ length: CELL_COUNT }, (_, i) => ({
      current: i % brands.length,
      next: null,
      isSwapping: false,
      isPaused: false,
    }))
  );

  const stateRef = useRef(cellStates);
  const intervalsRef = useRef<number[]>([]);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    stateRef.current = cellStates;
  }, [cellStates]);

  useEffect(() => {
    const clearAll = () => {
      intervalsRef.current.forEach((id) => clearInterval(id));
      intervalsRef.current = [];
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };

    for (let i = 0; i < CELL_COUNT; i++) {
      const initialDelay = getRandomInt(0, 3000);
      const intervalMs = getRandomInt(2000, 5000);

      const timeoutId = window.setTimeout(() => {
        const runSwap = () => {
          const states = stateRef.current;
          const cell = states[i];
          if (cell.isPaused || cell.isSwapping) return;

          const used = getUsedBrandIndices(states, i);
          const nextIndex = pickNextBrandIndex(cell.current, used);

          setCellStates((prev) => {
            const next = [...prev];
            next[i] = {
              ...next[i],
              next: nextIndex,
              isSwapping: true,
            };
            return next;
          });

          const swapTimeoutId = window.setTimeout(() => {
            setCellStates((prev) => {
              const next = [...prev];
              const cellNext = next[i].next;
              next[i] = {
                current: cellNext ?? next[i].current,
                next: null,
                isSwapping: false,
                isPaused: next[i].isPaused,
              };
              return next;
            });
          }, TRANSITION_MS);

          timeoutsRef.current.push(swapTimeoutId);
        };

        runSwap();
        const intervalId = window.setInterval(runSwap, intervalMs);
        intervalsRef.current.push(intervalId);
      }, initialDelay);

      timeoutsRef.current.push(timeoutId);
    }

    return clearAll;
  }, []);

  return (
    <section className="border-y border-border-subtle bg-bg-base py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-widest text-text-muted">
          Trusted by brand teams across East Africa
        </p>
        <div className="grid grid-cols-[repeat(2,1fr)] justify-center gap-3 sm:grid-cols-[repeat(4,160px)]">
          {cellStates.map((cell, i) => (
            <LogoCell
              key={i}
              cellIndex={i}
              state={cell}
              onPause={(paused) =>
                setCellStates((prev) => {
                  const next = [...prev];
                  next[i] = { ...next[i], isPaused: paused };
                  return next;
                })
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoCell({
  cellIndex,
  state,
  onPause,
}: {
  cellIndex: number;
  state: CellState;
  onPause: (paused: boolean) => void;
}) {
  const { current, next, isSwapping } = state;
  const brandCurrent = brands[current];
  const brandNext = next !== null ? brands[next] : null;

  return (
    <div
      className="group relative flex h-[72px] w-full cursor-default items-center justify-center overflow-hidden rounded-xl border border-border-default bg-bg-surface sm:w-[160px] hover:border-border-strong"
      onMouseEnter={() => onPause(true)}
      onMouseLeave={() => onPause(false)}
    >
      {/* Current logo */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: isSwapping ? 0 : 1,
          transform: isSwapping ? 'translateY(-40%)' : 'translateY(0)',
          transition: 'all 400ms ease',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-accent">{brandCurrent.symbol}</span>
          <span className="font-display text-sm font-semibold text-text-primary opacity-60 transition-opacity group-hover:opacity-100">
            {brandCurrent.name}
          </span>
        </div>
      </div>

      {/* Next logo (only when next is set) */}
      {brandNext && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isSwapping ? 1 : 0,
            transform: isSwapping ? 'translateY(0)' : 'translateY(40%)',
            transition: isSwapping ? 'all 400ms ease' : 'none',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-accent">{brandNext.symbol}</span>
            <span className="font-display text-sm font-semibold text-text-primary opacity-60 transition-opacity group-hover:opacity-100">
              {brandNext.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
