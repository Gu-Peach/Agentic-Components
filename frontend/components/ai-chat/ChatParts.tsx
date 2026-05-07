'use client';

import { Bot, Sparkles, UserRound } from 'lucide-react';
import type { AgentMessage } from '@/types/agent';

export function ChatHeader({ streaming }: { streaming: boolean }) {
  return (
    <div className='flex h-10 items-center justify-between border-b border-[var(--border-soft)] px-3'>
      <div className='flex items-center gap-2 text-sm text-[var(--text-primary)]'>
        <Sparkles size={14} className='text-[var(--text-accent)]' />
        <span>Agent Chat</span>
      </div>
      <span className='text-[11px] text-[var(--text-muted)]'>
        {streaming ? 'Agent streaming...' : 'Agent SSE'}
      </span>
    </div>
  );
}

export function MessageCard({ message }: { message: AgentMessage }) {
  const Icon = message.role === 'user' ? UserRound : Bot;

  return (
    <div className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.16)] px-3 py-2'>
      <div className='mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]'>
        <Icon size={11} />
        {message.role}
      </div>
      <p className='whitespace-pre-wrap text-sm leading-6 text-[var(--text-secondary)]'>
        {message.content}
      </p>
    </div>
  );
}
