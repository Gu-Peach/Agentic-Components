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
  agentSceneName: string;
  isSceneLoading: boolean;
  loadError: string | null;
  selectDevice: (deviceId: string) => void;
  updateDeviceTransform: (
    deviceId: string,
    transform: SceneDevice['transform'],
  ) => void;
  loadCatalogItem: (device: CatalogDevice) => Promise<void>;
};

const mockDevices: SceneDevice[] = [];

const initialSelectedId = mockDevices[0]?.id ?? '';

function createSceneFromCatalogItem(
  device: CatalogDevice,
  index = 0,
): SceneDevice {
  const column = index % 4;
  const row = Math.floor(index / 4);
  const preserveSceneCoordinates = shouldPreserveSceneCoordinates(device);

  return {
    id: `${device.id}-instance-${index}`,
    name: `${device.name} ${index + 1}`,
    type: device.deviceType,
    catalogId: device.id,
    modelUrl: device.modelUrl,
    preserveSceneCoordinates,
    source: device.kind,
    transform: {
      position: preserveSceneCoordinates ? [0, 0, 0] : [column * 8, 0, row * 8],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };
}

function shouldPreserveSceneCoordinates(device: CatalogDevice) {
  return device.kind === 'layout' || device.name === 'Coordinated Robotic Transfer Unit';
}

export const useSceneStore = create<SceneState>((set) => ({
  devices: mockDevices,
  selectedDeviceId: initialSelectedId,
  sceneLabel: '焊接单元',
  sceneSource: 'mock',
  agentSceneName: 'Coordinated Robotic Transfer Unit',
  isSceneLoading: false,
  loadError: null,
  selectDevice: (deviceId) =>
    set((state) =>
      produce(state, (draft) => {
        draft.selectedDeviceId = deviceId;
      }),
    ),
  updateDeviceTransform: (deviceId, transform) =>
    set((state) =>
      produce(state, (draft) => {
        const device = draft.devices.find((item) => item.id === deviceId);

        if (!device) {
          return;
        }

        device.transform = transform;
      }),
    ),
  loadCatalogItem: async (device) => {
    set({ isSceneLoading: true, loadError: null });

    try {
      const nextIndex = useSceneStore.getState().devices.length;
      const nextDevice = createSceneFromCatalogItem(device, nextIndex);

      set((state) => ({
        devices: [...state.devices, nextDevice],
        selectedDeviceId: nextDevice.id,
        sceneLabel:
          state.devices.length === 0 ? device.name : `${state.devices.length + 1} Models`,
        sceneSource: device.kind,
        agentSceneName: device.name,
        isSceneLoading: false,
      }));
    } catch (error) {
      set({
        isSceneLoading: false,
        loadError: error instanceof Error ? error.message : '场景加载失败',
      });
    }
  },
}));
