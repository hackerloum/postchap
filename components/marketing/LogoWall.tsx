'use client';

import { useState, useEffect, useRef } from 'react';

type Brand = {
  id: string;
  name: string;
  lightSrc: string;
  darkSrc: string;
};

type CellState = {
  currentBrand: Brand;
  nextBrand: Brand | null;
  isAnimating: boolean;
  isPaused: boolean;
};

const brands: Brand[] = [
  { id: 'safaricom', name: 'Safaricom', lightSrc: '/logos/safaricom_light.svg', darkSrc: '/logos/safaricom_dark.svg' },
  { id: 'vodacom', name: 'Vodacom', lightSrc: '/logos/vodacom_light.svg', darkSrc: '/logos/vodacom_dark.svg' },
  { id: 'airtel', name: 'Airtel', lightSrc: '/logos/airtel_light.svg', darkSrc: '/logos/airtel_dark.svg' },
  { id: 'crdb', name: 'CRDB Bank', lightSrc: '/logos/crdb_light.svg', darkSrc: '/logos/crdb_dark.svg' },
  { id: 'nmb', name: 'NMB Bank', lightSrc: '/logos/nmb_light.svg', darkSrc: '/logos/nmb_dark.svg' },
  { id: 'equity', name: 'Equity Bank', lightSrc: '/logos/equity_light.svg', darkSrc: '/logos/equity_dark.svg' },
  { id: 'jubilee', name: 'Jubilee', lightSrc: '/logos/jubilee_light.svg', darkSrc: '/logos/jubilee_dark.svg' },
  { id: 'azam', name: 'Azam Media', lightSrc: '/logos/azam_light.svg', darkSrc: '/logos/azam_dark.svg' },
  { id: 'precision', name: 'Precision Air', lightSrc: '/logos/precision_light.svg', darkSrc: '/logos/precision_dark.svg' },
  { id: 'kcb', name: 'KCB', lightSrc: '/logos/kcb_light.svg', darkSrc: '/logos/kcb_dark.svg' },
  { id: 'absa', name: 'Absa', lightSrc: '/logos/absa_light.svg', darkSrc: '/logos/absa_dark.svg' },
  { id: 'dstv', name: 'DStv', lightSrc: '/logos/dstv_light.svg', darkSrc: '/logos/dstv_dark.svg' },
];

const CELL_COUNT = 8;
const TRANSITION_MS = 500;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUsedBrandIds(cellStates: CellState[]): Set<string> {
  const used = new Set<string>();
  cellStates.forEach((cell) => {
    used.add(cell.currentBrand.id);
    if (cell.nextBrand) used.add(cell.nextBrand.id);
  });
  return used;
}

function pickNextBrand(usedIds: Set<string>): Brand {
  const candidates = brands.filter((b) => !usedIds.has(b.id));
  if (candidates.length === 0) return brands[getRandomInt(0, brands.length - 1)];
  return candidates[getRandomInt(0, candidates.length - 1)];
}

export function LogoWall() {
  const [cellStates, setCellStates] = useState<CellState[]>(() =>
    Array.from({ length: CELL_COUNT }, (_, i) => ({
      currentBrand: brands[i % brands.length],
      nextBrand: null,
      isAnimating: false,
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
      const initialDelay = getRandomInt(0, 4000);
      const intervalMs = getRandomInt(2500, 6000);

      const delayId = window.setTimeout(() => {
        const runSwap = () => {
          const states = stateRef.current;
          const cell = states[i];
          if (cell.isPaused || cell.isAnimating) return;

          const used = getUsedBrandIds(states);
          const next = pickNextBrand(used);

          setCellStates((prev) => {
            const nextState = [...prev];
            nextState[i] = {
              ...nextState[i],
              nextBrand: next,
              isAnimating: true,
            };
            return nextState;
          });

          const doneId = window.setTimeout(() => {
            setCellStates((prev) => {
              const nextState = [...prev];
              const cellNext = nextState[i].nextBrand;
              nextState[i] = {
                currentBrand: cellNext ?? nextState[i].currentBrand,
                nextBrand: null,
                isAnimating: false,
                isPaused: nextState[i].isPaused,
              };
              return nextState;
            });
          }, TRANSITION_MS);

          timeoutsRef.current.push(doneId);
        };

        runSwap();
        const intervalId = window.setInterval(runSwap, intervalMs);
        intervalsRef.current.push(intervalId);
      }, initialDelay);

      timeoutsRef.current.push(delayId);
    }

    return clearAll;
  }, []);

  return (
    <section className="border-y border-border-subtle bg-bg-base py-20">
      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-widest text-text-muted">
          Trusted by brand teams across East Africa — powered by ArtMaster
        </p>
        <div className="grid grid-cols-2 justify-items-center gap-3 md:grid-cols-4">
          {cellStates.map((cell, i) => (
            <LogoCell
              key={i}
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
  state,
  onPause,
}: {
  state: CellState;
  onPause: (paused: boolean) => void;
}) {
  const { currentBrand, nextBrand, isAnimating } = state;

  return (
    <div
      className="relative h-[72px] w-full cursor-default overflow-hidden rounded-xl border border-border-default bg-bg-surface transition-[border-color] duration-200 md:w-[160px] hover:border-border-strong"
      onMouseEnter={() => onPause(true)}
      onMouseLeave={() => onPause(false)}
    >
      {/* Container A — current brand */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: isAnimating ? 0 : 1,
          transform: isAnimating ? 'translateY(-50%)' : 'translateY(0)',
          transition: 'opacity 500ms ease, transform 500ms ease',
        }}
      >
        <img src={currentBrand.lightSrc} alt={currentBrand.name} className="logo-light h-auto max-h-8 w-auto max-w-[120px] object-contain" />
        <img src={currentBrand.darkSrc} alt={currentBrand.name} className="logo-dark h-auto max-h-8 w-auto max-w-[120px] object-contain" />
      </div>

      {/* Container B — next brand (when queued) */}
      {nextBrand && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: isAnimating ? 1 : 0,
            transform: isAnimating ? 'translateY(0)' : 'translateY(50%)',
            transition: isAnimating ? 'opacity 500ms ease, transform 500ms ease' : 'none',
          }}
        >
          <img src={nextBrand.lightSrc} alt={nextBrand.name} className="logo-light h-auto max-h-8 w-auto max-w-[120px] object-contain" />
          <img src={nextBrand.darkSrc} alt={nextBrand.name} className="logo-dark h-auto max-h-8 w-auto max-w-[120px] object-contain" />
        </div>
      )}
    </div>
  );
}
