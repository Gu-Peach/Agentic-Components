'use client';

import { LoaderCircle } from 'lucide-react';
import type { CatalogDevice } from '@/types/catalog';

type CatalogGridProps = {
  devices: CatalogDevice[];
  error: string | null;
  isLoading: boolean;
  isSceneLoading: boolean;
  onSelect: (device: CatalogDevice) => void;
};

export function CatalogGrid({
  devices,
  error,
  isLoading,
  isSceneLoading,
  onSelect,
}: CatalogGridProps) {
  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)]'>
        <LoaderCircle className='animate-spin' size={16} />
        <span>正在读取公共模型...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className='rounded border border-[var(--border-strong)] bg-[var(--bg-input)] p-3 text-sm text-[var(--text-secondary)]'>
        {error}
      </div>
    );
  }

  if (devices.length === 0) {
    return (
      <div className='rounded border border-dashed border-[var(--border-strong)] p-4 text-sm text-[var(--text-secondary)]'>
        暂未发现可用模型。请确认 Supabase Storage 桶中存在 `Components/` 或 `Layouts/` 目录及模型文件。
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 gap-3'>
      {devices.map((device, index) => (
        <button
          key={device.id}
          className='group flex flex-col text-left'
          onClick={() => onSelect(device)}
          type='button'
        >
          <div className='flex h-24 items-end justify-start border border-[var(--border-strong)] bg-[linear-gradient(180deg,#808080,#5d5d5d)] p-2 transition group-hover:border-[var(--accent-line)]'>
            <div className='flex w-full items-end justify-between'>
              <div className='h-12 w-10 bg-[#e5c221]' />
              <div className='h-8 w-14 bg-[#c8c8c8]' />
              <div className='h-16 w-5 bg-[#8ad2ef]' />
            </div>
          </div>
          <span className='mt-2 line-clamp-2 text-sm leading-5 text-[var(--text-secondary)]'>
            {device.name}
          </span>
          <span className='text-xs uppercase tracking-wide text-[var(--text-muted)]'>
            {device.kind} · {device.deviceType} · {index + 1}
            {isSceneLoading ? ' · loading' : ''}
          </span>
        </button>
      ))}
    </div>
  );
}
