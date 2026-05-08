'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import type { CatalogDevice } from '@/types/catalog';
import type {
  InterfaceAnchorMap,
  DeviceInterfaceConfig,
  InterfaceBounds,
  InterfaceConnection,
  SceneDevice,
} from '@/types/scene';

type SceneState = {
  devices: SceneDevice[];
  selectedDeviceId: string;
  sceneLabel: string;
  sceneSource: 'mock' | 'component' | 'layout';
  agentSceneName: string;
  isSceneLoading: boolean;
  loadError: string | null;
  interfaceConnections: InterfaceConnection[];
  selectDevice: (deviceId: string) => void;
  updateDeviceTransform: (
    deviceId: string,
    transform: SceneDevice['transform'],
  ) => void;
  updateDeviceBounds: (
    deviceId: string,
    bounds: InterfaceBounds | null,
  ) => void;
  updateDeviceAnchors: (
    deviceId: string,
    anchors: InterfaceAnchorMap | null,
  ) => void;
  updateInterfaceConnection: (
    sourceDeviceId: string,
    sourceInterface: string,
    targetDeviceId: string,
    targetInterface: string,
  ) => void;
  loadCatalogItem: (device: CatalogDevice) => Promise<void>;
};

const mockDevices: SceneDevice[] = [];

const initialSelectedId = mockDevices[0]?.id ?? '';

function createSceneFromCatalogItem(
  device: CatalogDevice,
  index = 0,
  interfaceConfig?: DeviceInterfaceConfig | null,
): SceneDevice {
  const preserveSceneCoordinates = shouldPreserveSceneCoordinates(device);

  return {
    id: `${device.id}-instance-${index}`,
    name: `${device.name} ${index + 1}`,
    type: device.deviceType,
    catalogId: device.id,
    modelUrl: device.modelUrl,
    interfaceUrl: device.interfaceUrl,
    interfaceConfig: interfaceConfig ?? null,
    preserveSceneCoordinates,
    modelBounds: null,
    modelAnchors: null,
    source: device.kind,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };
}

function shouldPreserveSceneCoordinates(device: CatalogDevice) {
  return (
    device.kind === 'layout'
    || device.name === 'Coordinated Robotic Transfer Unit'
    || device.name === 'Intelligent Storage and Logistics Line'
  );
}

export const useSceneStore = create<SceneState>((set) => ({
  devices: mockDevices,
  selectedDeviceId: initialSelectedId,
  sceneLabel: '焊接单元',
  sceneSource: 'mock',
  agentSceneName: 'Coordinated Robotic Transfer Unit',
  isSceneLoading: false,
  loadError: null,
  interfaceConnections: [],
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
  updateDeviceBounds: (deviceId, bounds) =>
    set((state) =>
      produce(state, (draft) => {
        const device = draft.devices.find((item) => item.id === deviceId);

        if (!device) {
          return;
        }

        if (isSameJson(device.modelBounds, bounds)) {
          return;
        }

        device.modelBounds = bounds;
      }),
    ),
  updateDeviceAnchors: (deviceId, anchors) =>
    set((state) =>
      produce(state, (draft) => {
        const device = draft.devices.find((item) => item.id === deviceId);

        if (!device) {
          return;
        }

        if (isSameJson(device.modelAnchors, anchors)) {
          return;
        }

        device.modelAnchors = anchors;
      }),
    ),
  updateInterfaceConnection: (
    sourceDeviceId,
    sourceInterface,
    targetDeviceId,
    targetInterface,
  ) =>
    set((state) =>
      produce(state, (draft) => {
        const id = `${sourceDeviceId}:${sourceInterface}`;
        const existing = draft.interfaceConnections.find((item) => item.id === id);

        if (!targetDeviceId || !targetInterface) {
          draft.interfaceConnections = draft.interfaceConnections.filter(
            (item) => item.id !== id,
          );
          return;
        }

        const nextConnection: InterfaceConnection = {
          id,
          sourceDeviceId,
          sourceInterface,
          targetDeviceId,
          targetInterface,
        };

        if (existing) {
          Object.assign(existing, nextConnection);
        } else {
          draft.interfaceConnections.push(nextConnection);
        }
      }),
    ),
  loadCatalogItem: async (device) => {
    set({ isSceneLoading: true, loadError: null });

    try {
      const nextIndex = useSceneStore.getState().devices.length;
      const interfaceConfig = await loadDeviceInterfaceConfig(device.interfaceUrl);
      const nextDevice = createSceneFromCatalogItem(device, nextIndex, interfaceConfig);

      set((state) => ({
        devices: [...state.devices, nextDevice],
        selectedDeviceId: nextDevice.id,
        sceneLabel: device.name,
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

async function loadDeviceInterfaceConfig(
  interfaceUrl: string | undefined,
): Promise<DeviceInterfaceConfig | null> {
  if (!interfaceUrl) {
    return null;
  }

  const response = await fetch(interfaceUrl, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`接口配置加载失败：${interfaceUrl}`);
  }

  return (await response.json()) as DeviceInterfaceConfig;
}

function isSameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}
