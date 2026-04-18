'use client';

import { Bell, FolderTree, Pin, Plus, Search, X } from 'lucide-react';

type TopBarProps = {
  projectId: string;
};

const actions = [Pin, Plus, Search, Bell, X];

export function TopBar({ projectId }: TopBarProps) {
  return (
    <header className='flex h-11 items-center justify-between border-b border-[var(--border-soft)] bg-[#303030] px-3'>
      <div className='flex items-center gap-3'>
        <div className='flex items-center gap-2 text-[var(--text-primary)]'>
          <FolderTree size={14} />
          <h1 className='text-sm font-semibold'>电子目录</h1>
        </div>
        <div className='hidden text-xs text-[var(--text-muted)] lg:block'>
          {projectId}
        </div>
      </div>
      <div className='flex items-center gap-1 text-[var(--text-muted)]'>
        {actions.map((Icon, index) => (
          <button
            key={`${projectId}-${index}`}
            className='flex h-7 w-7 items-center justify-center rounded-sm transition hover:bg-[var(--bg-panel-hover)] hover:text-[var(--text-primary)]'
            type='button'
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </header>
  );
}
