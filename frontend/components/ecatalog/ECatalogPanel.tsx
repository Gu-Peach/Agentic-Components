'use client';

import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Grid2x2,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
} from 'lucide-react';
import { useCatalogStore } from '@/stores/catalogStore';

const treeItems = [
  { label: '所有模型', depth: 0, open: true, icon: Star },
  { label: '公共模型', depth: 1, open: true, icon: Folder },
  { label: 'Components', depth: 2, open: false, icon: Folder },
  { label: 'Layouts', depth: 2, open: false, icon: Folder },
  { label: '我的模型', depth: 1, open: false, icon: Folder },
  { label: '当前打开', depth: 1, open: false, icon: Folder },
  { label: '最近模型', depth: 1, open: false, icon: Folder },
  { label: '最常使用的', depth: 1, open: false, icon: Folder },
];

function InnerResizeHandle() {
  return (
    <Separator className='relative bg-[var(--border-soft)] transition hover:bg-[var(--accent-line)] data-[orientation=vertical]:w-px data-[orientation=vertical]:cursor-col-resize' />
  );
}

export function ECatalogPanel() {
  const { collections, devices, query, setQuery } = useCatalogStore();
  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className='flex h-full flex-col bg-[var(--bg-panel)]'>
      <Group>
        <Panel defaultSize={38} minSize={28}>
          <div className='flex h-full flex-col border-r border-[var(--border-soft)]'>
            <div className='flex h-11 items-center justify-between border-b border-[var(--border-soft)] px-3'>
              <span className='text-sm font-semibold text-[var(--text-primary)]'>
                收藏
              </span>
              <button
                className='flex h-7 w-7 items-center justify-center rounded-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-panel-hover)]'
                type='button'
              >
                <Plus size={14} />
              </button>
            </div>
            <div className='flex-1 overflow-auto px-2 py-3'>
              <div className='mb-4 space-y-1'>
                {treeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={`${item.label}-${item.depth}`}
                      className='flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-panel-hover)]'
                      style={{ paddingLeft: `${item.depth * 14 + 8}px` }}
                      type='button'
                    >
                      {item.open ? (
                        <ChevronDown size={12} className='text-[var(--text-muted)]' />
                      ) : (
                        <ChevronRight size={12} className='text-[var(--text-muted)]' />
                      )}
                      <Icon size={14} className='text-[var(--text-secondary)]' />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className='border-t border-[var(--border-soft)] pt-3'>
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className='mb-1 rounded-sm px-2 py-1 text-xs text-[var(--text-muted)]'
                  >
                    {collection.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Panel>
        <InnerResizeHandle />
        <Panel defaultSize={62} minSize={42}>
          <div className='flex h-full flex-col'>
            <div className='flex items-center gap-2 border-b border-[var(--border-soft)] px-3 py-2'>
              <div className='flex flex-1 items-center gap-2 border border-[var(--border-strong)] bg-[#3b3b3b] px-2 py-1.5'>
                <Search size={14} className='text-[var(--text-muted)]' />
                <input
                  className='w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]'
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder='搜索'
                  value={query}
                />
              </div>
              {[Grid2x2, LayoutGrid, List].map((Icon, index) => (
                <button
                  key={index}
                  className='flex h-8 w-8 items-center justify-center border border-[var(--border-strong)] bg-[#3b3b3b] text-[var(--text-secondary)] transition hover:bg-[var(--bg-panel-hover)]'
                  type='button'
                >
                  <Icon size={14} />
                </button>
              ))}
            </div>
            <div className='flex-1 overflow-auto px-3 py-3'>
              <div className='grid grid-cols-2 gap-3'>
                {filteredDevices.map((device, index) => (
                  <button
                    key={device.id}
                    className='group flex flex-col text-left'
                    draggable
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
                      {device.deviceType} · {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className='flex items-center justify-between border-t border-[var(--border-soft)] px-3 py-2 text-xs text-[var(--text-muted)]'>
              <div className='flex items-center gap-4'>
                <span>组件</span>
                <span>布局</span>
                <span>文件</span>
              </div>
              <span>{filteredDevices.length} 项目</span>
            </div>
          </div>
        </Panel>
      </Group>
    </aside>
  );
}
