'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import type { CatalogDevice } from '@/types/catalog';
import type { SceneDevice } from '@/types/scene';

type SceneState = {
  devices: SceneDevice[];
  selectedDeviceId: string;
  sceneLabel: string;
  sceneSource: 'mock' | 'component' | 'layout';
  isSceneLoading: boolean;
  loadError: string | null;
  selectDevice: (deviceId: string) => void;
  loadCatalogItem: (device: CatalogDevice) => Promise<void>;
};

const mockDevices: SceneDevice[] = [
  {
    id: 'robot-left',
    name: 'ARC-2000i #1',
    type: 'robot',
    catalogId: 'arc-mate-120ic',
    source: 'mock',
    transform: {
      position: [-4, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  {
    id: 'robot-right',
    name: 'ARC-2000i #2',
    type: 'robot',
    catalogId: 'arc-mate-120id',
    source: 'mock',
    transform: {
      position: [4, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
];

const initialSelectedId = mockDevices[0]?.id ?? '';

function createSceneFromCatalogItem(
  device: CatalogDevice,
  index = 0,
): SceneDevice[] {
  return [
    {
      id: `${device.id}-instance-${index}`,
      name: device.name,
      type: device.deviceType,
      catalogId: device.id,
      modelUrl: device.modelUrl,
      source: device.kind,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
    },
  ];
}

export const useSceneStore = create<SceneState>((set) => ({
  devices: mockDevices,
  selectedDeviceId: initialSelectedId,
  sceneLabel: '焊接单元',
  sceneSource: 'mock',
  isSceneLoading: false,
  loadError: null,
  selectDevice: (deviceId) =>
    set((state) =>
      produce(state, (draft) => {
        draft.selectedDeviceId = deviceId;
      }),
    ),
  loadCatalogItem: async (device) => {
    set({ isSceneLoading: true, loadError: null });

    try {
      const nextDevices = createSceneFromCatalogItem(device);

      set({
        devices: nextDevices,
        selectedDeviceId: nextDevices[0]?.id ?? '',
        sceneLabel: device.name,
        sceneSource: device.kind,
        isSceneLoading: false,
      });
    } catch (error) {
      set({
        isSceneLoading: false,
        loadError: error instanceof Error ? error.message : '场景加载失败',
      });
    }
  },
}));
