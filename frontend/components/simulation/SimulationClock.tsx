'use client';

import { useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

const COMPLETION_EPSILON = 0.05;

export function SimulationClock() {
  const executionStartedAt = useSimulationStore((state) => state.executionStartedAt);

  useEffect(() => {
    if (!executionStartedAt) {
      return undefined;
    }

    let frameId = 0;
    let lastFrameAt = performance.now();

    const tick = (now: number) => {
      const store = useSimulationStore.getState();

      if (store.executionPlan && store.isRunning) {
        const deltaSeconds = Math.max(0, (now - lastFrameAt) / 1000);
        const elapsed = store.elapsedSeconds + deltaSeconds * store.speed;

        store.setElapsedSeconds(elapsed);
        emitDueEvents(elapsed);
        stopWhenComplete(elapsed);
      }

      lastFrameAt = now;
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [executionStartedAt]);

  return null;
}

function emitDueEvents(elapsed: number) {
  const store = useSimulationStore.getState();
  const emittedIds = new Set(store.emittedResultEventIds);
  const dueEvents = store.resultEvents.filter(
    (event) => event.time <= elapsed && !emittedIds.has(event.id),
  );

  for (const event of dueEvents) {
    store.appendLog(event.text, formatClock(event.time));
    store.markResultEventEmitted(event.id);
  }
}

function stopWhenComplete(elapsed: number) {
  const store = useSimulationStore.getState();
  const planEnd = Math.max(
    0,
    ...(store.executionPlan?.segments.map((segment) => segment.planned_end) ?? []),
  );
  const eventEnd = Math.max(0, ...store.resultEvents.map((event) => event.time));
  const endTime = Math.max(planEnd, eventEnd);

  if (endTime > 0 && elapsed >= endTime + COMPLETION_EPSILON) {
    store.setElapsedSeconds(endTime);
    store.setRunning(false);
  }
}

function formatClock(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  const hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
