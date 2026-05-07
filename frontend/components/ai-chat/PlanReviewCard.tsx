'use client';

import { Pencil, Play, X } from 'lucide-react';
import type { ExecutionPlan } from '@/lib/simulation/types';

type PlanReviewCardProps = {
  plan: ExecutionPlan;
  onApprove: () => void;
  onCancel: () => void;
  onRevise: () => void;
};

export function PlanReviewCard({
  plan,
  onApprove,
  onCancel,
  onRevise,
}: PlanReviewCardProps) {
  const segmentCount = plan.segments.length;
  const duration = Math.max(
    0,
    ...plan.segments.map((segment) => segment.planned_end),
  );
  const devices = Array.from(
    new Set(plan.segments.map((segment) => segment.device_id)),
  );

  return (
    <div className='border border-[var(--border-strong)] bg-[#202020] px-3 py-2'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <div>
          <p className='text-sm text-[var(--text-primary)]'>Plan pending</p>
          <p className='text-[11px] text-[var(--text-muted)]'>
            {segmentCount} steps / {duration.toFixed(1)}s
          </p>
        </div>
        <span className='text-[11px] text-[var(--text-accent)]'>
          waiting_user_approval
        </span>
      </div>
      <p className='line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]'>
        {devices.join(' -> ') || 'No device'}
      </p>
      <div className='mt-3 flex gap-2'>
        <button
          className='flex h-8 items-center gap-1 bg-[var(--bg-accent)] px-2 text-xs text-white hover:bg-[var(--bg-accent-strong)]'
          onClick={onApprove}
          type='button'
        >
          <Play size={13} />
          Run
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
