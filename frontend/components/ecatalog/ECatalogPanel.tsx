'use client';

import { useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { Grid2x2, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { CatalogGrid } from '@/components/ecatalog/catalogGrid';
import { CatalogTree } from '@/components/ecatalog/catalogTree';
import { useCatalogStore } from '@/stores/catalogStore';
import { useSceneStore } from '@/stores/sceneStore';

function InnerResizeHandle() {
  return (
    <Separator className='relative bg-[var(--border-soft)] transition hover:bg-[var(--accent-line)] data-[orientation=vertical]:w-px data-[orientation=vertical]:cursor-col-resize' />
  );
}

export function ECatalogPanel() {
  const {
    collections,
    categories,
    devices,
    query,
    activeSection,
    activeCategory,
    isLoading,
    hasLoaded,
    error,
    setQuery,
    setActiveSection,
    setActiveCategory,
    loadPublicCatalog,
  } = useCatalogStore();
  const { loadCatalogItem, isSceneLoading } = useSceneStore();

  useEffect(() => {
    if (!hasLoaded) {
      void loadPublicCatalog();
    }
  }, [hasLoaded, loadPublicCatalog]);

  const filteredDevices = devices.filter((device) => {
    const matchesQuery = device.name.toLowerCase().includes(query.toLowerCase());
    const matchesSection =
      activeSection === 'all' ? true : device.section === activeSection;
    const matchesCategory =
      activeCategory && activeSection === 'components'
        ? device.category === activeCategory
        : true;

    return matchesQuery && matchesSection && matchesCategory;
  });

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
              <CatalogTree
                activeCategory={activeCategory}
                activeSection={activeSection}
                categories={categories}
                devices={devices}
                onSelectCategory={setActiveCategory}
                onSelectSection={setActiveSection}
              />
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
              <CatalogGrid
                devices={filteredDevices}
                error={error}
                isLoading={isLoading}
                isSceneLoading={isSceneLoading}
                onSelect={(device) => void loadCatalogItem(device)}
              />
            </div>
            <div className='flex items-center justify-between border-t border-[var(--border-soft)] px-3 py-2 text-xs text-[var(--text-muted)]'>
              <div className='flex items-center gap-4'>
                <span>组件</span>
                <span>布局</span>
                <span>{isSceneLoading ? '加载中' : '已连接 Supabase'}</span>
              </div>
              <span>{filteredDevices.length} 项目</span>
            </div>
          </div>
        </Panel>
      </Group>
    </aside>
  );
}
