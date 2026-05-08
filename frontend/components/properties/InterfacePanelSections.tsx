'use client';

import { CornerDownRight, Maximize2, Minimize2 } from 'lucide-react';

export function InterfaceToolbar({
  isExpanded,
  pendingLabel,
  onExpand,
  onPlay,
}: {
  isExpanded: boolean;
  pendingLabel: string | null;
  onExpand: () => void;
  onPlay: () => void;
}) {
  const ExpandIcon = isExpanded ? Minimize2 : Maximize2;

  return (
    <div className='flex items-center justify-between gap-3 border border-[var(--border-strong)] bg-[rgba(0,0,0,0.14)] px-3 py-2 text-xs text-[var(--text-secondary)]'>
      <span className='truncate'>
        {pendingLabel
          ? `Pending: ${pendingLabel}`
          : 'Click one interface, then click another to connect'}
      </span>
      <div className='flex shrink-0 items-center gap-2'>
        <button
          className='grid h-8 w-8 place-items-center border border-[var(--border-soft)] text-[var(--text-primary)] transition hover:border-[var(--accent-line)]'
          onClick={onExpand}
          type='button'
        >
          <ExpandIcon size={14} />
        </button>
        <button
          className='h-8 border border-[var(--accent-line)] bg-[rgba(77,163,255,0.12)] px-3 text-[var(--text-primary)] transition hover:bg-[rgba(77,163,255,0.22)]'
          onClick={onPlay}
          type='button'
        >
          Play Interface Path
        </button>
      </div>
    </div>
  );
}

export function ConnectionSummary({
  items,
}: {
  items: { id: string; source: string; target: string }[];
}) {
  return (
    <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.12)] p-2'>
      {items.length ? (
        <div className='space-y-1'>
          {items.map((item) => (
            <div
              key={item.id}
              className='grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[11px] text-[var(--text-secondary)]'
            >
              <span className='truncate'>{item.source}</span>
              <CornerDownRight size={12} className='text-[var(--accent-line)]' />
              <span className='truncate'>{item.target}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-xs text-[var(--text-muted)]'>No connection path</div>
      )}
    </div>
  );
}
