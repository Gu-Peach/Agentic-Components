'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import type { CatalogDevice } from '@/types/catalog';
import {
  createSceneFromCatalogItem,
  filterConnectionsByDevice,
  isSameJson,
  loadDeviceInterfaceConfig,
  nextSelectionAfterRemoval,
} from '@/stores/sceneStore.helpers';
import type {
  InterfaceAnchorMap,
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
  removeDevice: (deviceId: string) => void;
  replaceInterfaceConnections: (connections: InterfaceConnection[]) => void;
  loadCatalogItem: (device: CatalogDevice) => Promise<void>;
};

const mockDevices: SceneDevice[] = [];

const initialSelectedId = mockDevices[0]?.id ?? '';

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
  removeDevice: (deviceId) =>
    set((state) =>
      produce(state, (draft) => {
        const device = draft.devices.find((item) => item.id === deviceId);

        if (!device) {
          return;
        }

        draft.devices = draft.devices.filter((item) => item.id !== deviceId);
        draft.interfaceConnections = filterConnectionsByDevice(
          draft.interfaceConnections,
          deviceId,
        );
        draft.selectedDeviceId = nextSelectionAfterRemoval(
          draft.devices,
          deviceId,
          draft.selectedDeviceId,
        );
        if (!draft.devices.length) {
          draft.sceneLabel = '焊接单元';
          draft.sceneSource = 'mock';
          draft.agentSceneName = 'Coordinated Robotic Transfer Unit';
        }
      }),
    ),
  replaceInterfaceConnections: (connections) =>
    set((state) =>
      produce(state, (draft) => {
        draft.interfaceConnections = [...connections];
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
