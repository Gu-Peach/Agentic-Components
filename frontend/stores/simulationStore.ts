'use client';

import { create } from 'zustand';
import type {
  AgentResultEvent,
  ExecutionPlan,
  SegmentObservation,
} from '@/lib/simulation/types';

type SimulationLog = {
  id: string;
  time: string;
  message: string;
};

type SimulationState = {
  isRunning: boolean;
  currentTime: string;
  elapsedSeconds: number;
  speed: number;
  logs: SimulationLog[];
  executionPlan: ExecutionPlan | null;
  executionStartedAt: number | null;
  stepSessionId: string | null;
  resultEvents: AgentResultEvent[];
  emittedResultEventIds: string[];
  completedSegmentIds: string[];
  observations: SegmentObservation[];
  setRunning: (value: boolean) => void;
  setSpeed: (value: number) => void;
  setElapsedSeconds: (value: number) => void;
  appendLog: (message: string, time?: string) => void;
  setExecutionPlan: (plan: ExecutionPlan) => void;
  setStepSessionId: (sessionId: string | null) => void;
  queueResultEvent: (event: Omit<AgentResultEvent, 'id'> & { id?: string }) => void;
  markResultEventEmitted: (eventId: string) => void;
  recordSegmentObservation: (
    observation: Omit<SegmentObservation, 'type' | 'recordedAt'>,
  ) => SegmentObservation | null;
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
  elapsedSeconds: 0,
  speed: 1,
  logs: initialLogs,
  executionPlan: null,
  executionStartedAt: null,
  stepSessionId: null,
  resultEvents: [],
  emittedResultEventIds: [],
  completedSegmentIds: [],
  observations: [],
  setRunning: (value) => set({ isRunning: value }),
  setSpeed: (value) => set({ speed: value }),
  setElapsedSeconds: (elapsedSeconds) =>
    set({
      elapsedSeconds,
      currentTime: formatClock(elapsedSeconds),
    }),
  appendLog: (message, time) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: `log-${Date.now()}-${state.logs.length}`,
          time: time ?? state.currentTime,
          message,
        },
      ],
    })),
  setExecutionPlan: (executionPlan) =>
    set({
      executionPlan,
      executionStartedAt: performance.now(),
      elapsedSeconds: 0,
      currentTime: '00:00:00',
      isRunning: true,
      stepSessionId: null,
      resultEvents: [],
      emittedResultEventIds: [],
      completedSegmentIds: [],
      observations: [],
    }),
  setStepSessionId: (stepSessionId) => set({ stepSessionId }),
  queueResultEvent: (event) =>
    set((state) => {
      const normalized = normalizeResultEvent(event);
      const exists = state.resultEvents.some((item) => item.id === normalized.id);

      if (exists) {
        return state;
      }

      return {
        resultEvents: [...state.resultEvents, normalized].sort(
          (left, right) => left.time - right.time,
        ),
      };
    }),
  markResultEventEmitted: (eventId) =>
    set((state) => ({
      emittedResultEventIds: state.emittedResultEventIds.includes(eventId)
        ? state.emittedResultEventIds
        : [...state.emittedResultEventIds, eventId],
    })),
  recordSegmentObservation: (input) => {
    let recorded: SegmentObservation | null = null;
    set((state) => {
      const segmentId = input.segment_id ?? input.action_id ?? `${input.sim_time}`;
      if (state.completedSegmentIds.includes(segmentId)) {
        return state;
      }

      const observation: SegmentObservation = {
        type: 'step_observation',
        ...input,
        segment_id: input.segment_id,
        action_id: input.action_id,
        events: input.events.length ? input.events : ['segment_completed'],
        recordedAt: Date.now(),
      };
      recorded = observation;

      return {
        completedSegmentIds: [...state.completedSegmentIds, segmentId],
        observations: [...state.observations, observation],
      };
    });
    return recorded;
  },
  reset: () =>
    set({
      isRunning: false,
      currentTime: '00:00:00',
      elapsedSeconds: 0,
      executionPlan: null,
      executionStartedAt: null,
      stepSessionId: null,
      resultEvents: [],
      emittedResultEventIds: [],
      completedSegmentIds: [],
      observations: [],
      speed: 1,
      logs: initialLogs,
    }),
}));

function normalizeResultEvent(
  event: Omit<AgentResultEvent, 'id'> & { id?: string },
): AgentResultEvent {
  const time = Number.isFinite(event.time) ? event.time : 0;
  const id = event.id
    ?? `${event.type}-${event.source ?? 'sim'}-${event.event ?? 'event'}-${time}`;

  return {
    id,
    type: event.type,
    source: event.source,
    event: event.event,
    time,
    text: event.text,
  };
}

function formatClock(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  const hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
