'use client';

import { create } from 'zustand';

type SimulationLog = {
  id: string;
  time: string;
  message: string;
};

type SimulationState = {
  isRunning: boolean;
  currentTime: string;
  speed: number;
  logs: SimulationLog[];
  setRunning: (value: boolean) => void;
  setSpeed: (value: number) => void;
  reset: () => void;
};

const initialLogs: SimulationLog[] = [
  { id: 'log-1', time: '00:00:00', message: '输出面板已连接，等待仿真任务。' },
  { id: 'log-2', time: '00:00:02', message: '工作区已加载 Arc Welding Mock 场景。' },
  { id: 'log-3', time: '00:00:04', message: '当前为前端阶段，日志内容来自本地模拟。' },
];

export const useSimulationStore = create<SimulationState>((set) => ({
  isRunning: false,
  currentTime: '00:00:00',
  speed: 1,
  logs: initialLogs,
  setRunning: (value) => set({ isRunning: value }),
  setSpeed: (value) => set({ speed: value }),
  reset: () =>
    set({
      isRunning: false,
      currentTime: '00:00:00',
      speed: 1,
      logs: initialLogs,
    }),
}));
