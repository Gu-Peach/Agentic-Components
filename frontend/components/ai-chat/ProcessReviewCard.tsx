'use client';

import { Check, Pencil, X } from 'lucide-react';
import type { ProcessCompositionResult } from '@/types/process';

type ProcessReviewCardProps = {
  proposal: ProcessCompositionResult;
  onApprove: () => void;
  onCancel: () => void;
  onRevise: () => void;
};

export function ProcessReviewCard({
  proposal,
  onApprove,
  onCancel,
  onRevise,
}: ProcessReviewCardProps) {
  const connections = proposal.connectionsPreview ?? [];
  const reasoning = proposal.reasoningSummary ?? [];
  const warnings = proposal.warnings ?? [];

  return (
    <div className='border border-[var(--border-strong)] bg-[#202020] px-3 py-2'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <div>
          <p className='text-sm text-[var(--text-primary)]'>Process proposal</p>
          <p className='text-[11px] text-[var(--text-muted)]'>
            {connections.length} links
          </p>
        </div>
        <span className='text-[11px] text-[var(--text-accent)]'>
          proposal_ready
        </span>
      </div>
      <p className='text-xs leading-5 text-[var(--text-secondary)]'>
        {proposal.summary ?? 'Generated a process-flow proposal.'}
      </p>
      <div className='mt-2 space-y-1'>
        {connections.map((connection) => (
          <p
            key={connection}
            className='text-[11px] text-[var(--text-muted)]'
          >
            {connection}
          </p>
        ))}
      </div>
      {reasoning.length ? (
        <div className='mt-2 space-y-1'>
          {reasoning.map((item) => (
            <p key={item} className='text-[11px] text-[var(--text-secondary)]'>
              {item}
            </p>
          ))}
        </div>
      ) : null}
      {warnings.length ? (
        <div className='mt-2 space-y-1'>
          {warnings.map((item) => (
            <p key={item} className='text-[11px] text-amber-300'>
              {item}
            </p>
          ))}
        </div>
      ) : null}
      <div className='mt-3 flex gap-2'>
        <button
          className='flex h-8 items-center gap-1 bg-[var(--bg-accent)] px-2 text-xs text-white hover:bg-[var(--bg-accent-strong)]'
          onClick={onApprove}
          type='button'
        >
          <Check size={13} />
          Apply
        </button>
        <button
          className='flex h-8 items-center gap-1 border border-[var(--border-strong)] px-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          onClick={onRevise}
          type='button'
        >
          <Pencil size={13} />
          Revise
        </button>
        <button
          className='flex h-8 items-center gap-1 border border-[var(--border-strong)] px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          onClick={onCancel}
          type='button'
        >
          <X size={13} />
          Cancel
        </button>
      </div>
    </div>
  );
}
