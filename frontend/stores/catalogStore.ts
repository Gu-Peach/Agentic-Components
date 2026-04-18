'use client';

import { create } from 'zustand';
import type { CatalogCollection, CatalogDevice } from '@/types/catalog';

type CatalogState = {
  collections: CatalogCollection[];
  devices: CatalogDevice[];
  query: string;
  setQuery: (query: string) => void;
};

const collections: CatalogCollection[] = [
  { id: 'favorites', label: '收藏' },
  { id: 'all', label: '所有模型' },
  { id: 'public', label: '公共模型' },
  { id: 'mine', label: '我的模型' },
  { id: 'recent', label: '最近模型' },
];

const devices: CatalogDevice[] = [
  { id: 'arc-welding-1', name: 'Arc Welding and Testing BiW', deviceType: 'robot' },
  { id: 'arc-welding-2', name: 'Arc Welding Cell with Gantry', deviceType: 'robot' },
  { id: 'arc-welding-3', name: 'Arc Welding Cell with Multirobot', deviceType: 'robot' },
  { id: 'arc-welding-4', name: 'Arc Welding Cell with Track', deviceType: 'robot' },
  { id: 'water-cooler', name: 'Arc Welding Water Cooler', deviceType: 'storage' },
  { id: 'wire-drum', name: 'Arc Welding Wire Drum', deviceType: 'storage' },
  { id: 'wire-feeder', name: 'Arc Welding Wire Feeder', deviceType: 'storage' },
  { id: 'arc-mate-120ic', name: 'arcMate_120iC', deviceType: 'robot' },
  { id: 'arc-mate-120id', name: 'arcMate_120iD', deviceType: 'robot' },
  { id: 'smart-conveyor', name: 'Smart Conveyor Assembly', deviceType: 'conveyor' },
  { id: 'lift-shuttle', name: 'Lift Shuttle Station', deviceType: 'lift' },
  { id: 'storage-rack', name: 'Storage Rack A1-A8', deviceType: 'storage' },
];

export const useCatalogStore = create<CatalogState>((set) => ({
  collections,
  devices,
  query: '',
  setQuery: (query) => set({ query }),
}));
