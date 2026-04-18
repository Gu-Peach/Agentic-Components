'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import type { SceneDevice } from '@/types/scene';

type SceneState = {
  devices: SceneDevice[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => void;
};

const mockDevices: SceneDevice[] = [
  {
    id: 'robot-left',
    name: 'ARC-2000i #1',
    type: 'robot',
    catalogId: 'arc-mate-120ic',
    transform: {
      position: [1388.122, -866.361, 688.441],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  {
    id: 'robot-right',
    name: 'ARC-2000i #2',
    type: 'robot',
    catalogId: 'arc-mate-120id',
    transform: {
      position: [1400.221, -866.361, 709.991],
      rotation: [0, 0, -90],
      scale: [1, 1, 1],
    },
  },
  {
    id: 'conveyor-01',
    name: 'Conveyor Feed 01',
    type: 'conveyor',
    catalogId: 'smart-conveyor',
    transform: {
      position: [320, 0, 120],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  },
  {
    id: 'lift-01',
    name: 'Lift Shuttle 01',
    type: 'lift',
    catalogId: 'lift-shuttle',
    transform: {
      position: [640, 0, 180],
      rotation: [0, 90, 0],
      scale: [1, 1, 1],
    },
  },
];

export const useSceneStore = create<SceneState>((set) => ({
  devices: mockDevices,
  selectedDeviceId: mockDevices[1].id,
  selectDevice: (deviceId) =>
    set((state) =>
      produce(state, (draft) => {
        draft.selectedDeviceId = deviceId;
      }),
    ),
}));
