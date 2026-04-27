'use client';

import { ChevronDown, ChevronRight, Folder, Star } from 'lucide-react';
import type {
  CatalogCategory,
  CatalogDevice,
  CatalogSection,
} from '@/types/catalog';

type TreeItem = {
  label: string;
  depth: number;
  icon: typeof Folder | typeof Star;
  section?: CatalogSection;
  defaultOpen?: boolean;
};

const treeItems: TreeItem[] = [
  { label: '所有模型', depth: 0, icon: Star, section: 'all', defaultOpen: true },
  { label: '公共模型', depth: 1, icon: Folder, defaultOpen: true },
  { label: 'Components', depth: 2, icon: Folder, section: 'components', defaultOpen: true },
  { label: 'Layouts', depth: 2, icon: Folder, section: 'layouts' },
  { label: '我的模型', depth: 1, icon: Folder },
  { label: '当前打开', depth: 1, icon: Folder },
  { label: '最近模型', depth: 1, icon: Folder },
  { label: '最常使用的', depth: 1, icon: Folder },
];

type CatalogTreeProps = {
  activeCategory: string | null;
  activeSection: CatalogSection;
  categories: CatalogCategory[];
  devices: CatalogDevice[];
  onSelectCategory: (category: string | null) => void;
  onSelectSection: (section: CatalogSection) => void;
};

export function CatalogTree({
  activeCategory,
  activeSection,
  categories,
  devices,
  onSelectCategory,
  onSelectSection,
}: CatalogTreeProps) {
  const componentCategories = categories.filter(
    (category) => category.section === 'components' && category.itemCount > 0,
  );

  return (
    <div className='mb-4 space-y-1'>
      {treeItems.map((item) => {
        const Icon = item.icon;
        const isActionable = Boolean(item.section);
        const isActive = item.section === activeSection && !activeCategory;

        return (
          <div key={`${item.label}-${item.depth}`}>
            <button
              className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition ${
                isActive
                  ? 'bg-[var(--bg-panel-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)]'
              }`}
              onClick={() => {
                if (item.section) {
                  onSelectCategory(null);
                  onSelectSection(item.section);
                }
              }}
              style={{ paddingLeft: `${item.depth * 14 + 8}px` }}
              type='button'
            >
              {item.defaultOpen || item.depth === 0 ? (
                <ChevronDown size={12} className='text-[var(--text-muted)]' />
              ) : (
                <ChevronRight size={12} className='text-[var(--text-muted)]' />
              )}
              <Icon size={14} className='text-[var(--text-secondary)]' />
              <span>{item.label}</span>
              {isActionable ? (
                <span className='ml-auto text-[10px] uppercase tracking-wide text-[var(--text-muted)]'>
                  {item.section === 'all'
                    ? devices.length
                    : devices.filter((device) => device.section === item.section).length}
                </span>
              ) : null}
            </button>

            {item.section === 'components' && componentCategories.length > 0 ? (
              <div className='mt-1 space-y-1'>
                {componentCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition ${
                      activeCategory === category.label
                        ? 'bg-[var(--bg-panel-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-panel-hover)]'
                    }`}
                    onClick={() => {
                      onSelectSection('components');
                      onSelectCategory(category.label);
                    }}
                    style={{ paddingLeft: `${(item.depth + 1) * 14 + 8}px` }}
                    type='button'
                  >
                    <ChevronRight size={12} className='text-[var(--text-muted)]' />
                    <Folder size={14} className='text-[var(--text-secondary)]' />
                    <span>{category.label}</span>
                    <span className='ml-auto text-[10px] uppercase tracking-wide text-[var(--text-muted)]'>
                      {category.itemCount}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
