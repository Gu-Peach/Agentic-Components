'use client';

import { create } from 'zustand';

type InterfaceHighlight = {
  deviceId: string;
  interfaceName: string;
};

type InterfaceHighlightState = {
  activeHighlight: InterfaceHighlight | null;
  toggleHighlight: (deviceId: string, interfaceName: string) => void;
  clearHighlight: () => void;
};

export const useInterfaceHighlightStore = create<InterfaceHighlightState>((set) => ({
  activeHighlight: null,
  toggleHighlight: (deviceId, interfaceName) =>
    set((state) => ({
      activeHighlight:
        state.activeHighlight?.deviceId === deviceId
        && state.activeHighlight?.interfaceName === interfaceName
          ? null
          : { deviceId, interfaceName },
    })),
  clearHighlight: () => set({ activeHighlight: null }),
}));
