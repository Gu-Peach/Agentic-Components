'use client';

import { Bot, SendHorizonal, Sparkles } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';

export function AIChatPanel() {
  const { messages } = useAgentStore();

  return (
    <section className='flex h-full flex-col bg-[var(--bg-panel-alt)]'>
      <div className='flex h-10 items-center justify-between border-b border-[var(--border-soft)] px-3'>
        <div className='flex items-center gap-2 text-sm text-[var(--text-primary)]'>
          <Sparkles size={14} className='text-[var(--text-accent)]' />
          <span>大模型聊天</span>
        </div>
      </div>
      <div className='flex-1 space-y-2 overflow-auto px-3 py-3'>
        {messages.map((message) => (
          <div
            key={message.id}
            className='border border-[var(--border-strong)] bg-[rgba(0,0,0,0.16)] px-3 py-2'
          >
            <div className='mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-[var(--text-muted)]'>
              <Bot size={11} />
              {message.role}
            </div>
            <p className='text-sm leading-6 text-[var(--text-secondary)]'>
              {message.content}
            </p>
          </div>
        ))}
      </div>
      <div className='border-t border-[var(--border-soft)] p-3'>
        <div className='flex items-end gap-2 border border-[var(--border-strong)] bg-[#252525] p-2'>
          <textarea
            className='min-h-16 flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]'
            placeholder='输入工艺或仿真要求...'
            readOnly
          />
          <button
            className='flex h-8 w-8 items-center justify-center bg-[var(--bg-accent)] text-white transition hover:bg-[var(--bg-accent-strong)]'
            type='button'
          >
            <SendHorizonal size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
