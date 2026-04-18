'use client';

import { Pin, X } from 'lucide-react';
import { useSimulationStore } from '@/stores/simulationStore';

export function TerminalPanel() {
  const { logs } = useSimulationStore();

  return (
    <section className='flex h-full flex-col bg-[#262626] font-mono'>
      <div className='flex h-10 items-center justify-between border-b border-[var(--border-soft)] px-3 font-sans'>
        <h2 className='text-sm font-semibold text-[var(--text-primary)]'>输出</h2>
        <div className='flex items-center gap-2 text-[var(--text-muted)]'>
          <Pin size={13} />
          <X size={13} />
        </div>
      </div>
      <div className='flex-1 overflow-auto px-3 py-2 text-xs leading-6 text-[var(--text-secondary)]'>
        {logs.map((log) => (
          <div key={log.id} className='border-b border-[rgba(255,255,255,0.04)] py-1'>
            <span className='mr-3 text-[var(--text-muted)]'>[{log.time}]</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
