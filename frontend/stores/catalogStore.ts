'use client';

import { create } from 'zustand';
import { fetchPublicCatalog } from '@/lib/supabase/storageCatalog';
import type {
  CatalogCategory,
  CatalogCollection,
  CatalogDevice,
  CatalogSection,
} from '@/types/catalog';

type CatalogState = {
  collections: CatalogCollection[];
  categories: CatalogCategory[];
  devices: CatalogDevice[];
  query: string;
  activeSection: CatalogSection;
  activeCategory: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  setQuery: (query: string) => void;
  setActiveSection: (section: CatalogSection) => void;
  setActiveCategory: (category: string | null) => void;
  loadPublicCatalog: () => Promise<void>;
};

const collections: CatalogCollection[] = [
  { id: 'favorites', label: '收藏' },
  { id: 'all', label: '所有模型' },
  { id: 'public', label: '公共模型' },
  { id: 'mine', label: '我的模型' },
  { id: 'recent', label: '最近模型' },
];

export const useCatalogStore = create<CatalogState>((set, get) => ({
  collections,
  categories: [],
  devices: [],
  query: '',
  activeSection: 'all',
  activeCategory: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
  setQuery: (query) => set({ query }),
  setActiveSection: (activeSection) =>
    set({
      activeSection,
      activeCategory: activeSection === 'components' ? get().activeCategory : null,
    }),
  setActiveCategory: (activeCategory) =>
    set({
      activeSection: activeCategory ? 'components' : get().activeSection,
      activeCategory,
    }),
  loadPublicCatalog: async () => {
    if (get().isLoading) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const { devices, categories } = await fetchPublicCatalog();
      set({
        devices,
        categories,
        hasLoaded: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        hasLoaded: true,
        error: error instanceof Error ? error.message : '模型目录加载失败',
      });
    }
  },
}));
