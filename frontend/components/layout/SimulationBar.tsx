'use client';

import {
  Pause,
  Play,
  Rewind,
  Settings2,
  SkipBack,
  Square,
} from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';

export function SimulationBar() {
  const { isRunning, currentTime, speed, setRunning, setSpeed, reset } =
    useSimulationStore();

  return (
    <div className='pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center'>
      <div className='pointer-events-auto flex items-center gap-2 rounded-sm border border-[rgba(255,255,255,0.15)] bg-[rgba(120,120,120,0.32)] px-3 py-2 text-xs text-white shadow-[var(--shadow-panel)] backdrop-blur-sm'>
        <button
          className='rounded-full bg-[rgba(255,255,255,0.08)] p-1.5 text-white'
          onClick={reset}
          type='button'
        >
          <SkipBack size={14} />
        </button>
        <button
          className='rounded-full bg-[rgba(255,255,255,0.08)] p-1.5 text-white'
          onClick={reset}
          type='button'
        >
          <Rewind size={14} />
        </button>
        <button
          className='rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.1)] p-2 text-white'
          onClick={() => setRunning(!isRunning)}
          type='button'
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <button
          className='rounded-full bg-[rgba(255,255,255,0.08)] p-1.5 text-white'
          onClick={() => setRunning(false)}
          type='button'
        >
          <Square size={14} />
        </button>
        <span className='min-w-20 text-center font-mono text-[28px] leading-none text-[rgba(255,255,255,0.82)]'>
          {currentTime}
        </span>
        <span className='font-mono text-[var(--text-secondary)]'>x</span>
        <select
          aria-label='simulation-speed'
          className='rounded-sm border border-transparent bg-transparent px-1 py-1 text-[var(--text-secondary)] outline-none'
          onChange={(event) => setSpeed(Number(event.target.value))}
          value={speed}
        >
          {[0.1, 0.5, 1, 2, 5, 10].map((option) => (
            <option key={option} value={option}>
              {option.toFixed(1)}
            </option>
          ))}
        </select>
        <button
          className='ml-2 flex h-7 w-7 items-center justify-center rounded-sm text-[var(--text-secondary)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white'
          type='button'
        >
          <Settings2 size={14} />
        </button>
      </div>
    </div>
  );
}
