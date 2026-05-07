'use client';

import { useEffect } from 'react';
import type { SegmentObservation } from '@/lib/simulation/types';
import { useSimulationStore } from '@/stores/simulationStore';

const COMPLETION_EPSILON = 0.05;
let observationSync = Promise.resolve();

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
        emitSegmentObservations(elapsed);
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
    recordSimulationCompleted(endTime);
    store.setRunning(false);
  }
}

function emitSegmentObservations(elapsed: number) {
  const store = useSimulationStore.getState();
  const segments = store.executionPlan?.segments ?? [];

  for (const segment of segments) {
    if (segment.planned_end > elapsed) {
      continue;
    }

    const observation = store.recordSegmentObservation({
      action_id: segment.action_id,
      segment_id: segment.id,
      status: 'completed',
      sim_time: segment.planned_end,
      events: ['segment_completed'],
    });

    if (observation) {
      store.appendLog(
        `[Agent] observation ${segment.id ?? segment.device_id} completed`,
        formatClock(segment.planned_end),
      );
      if (store.stepSessionId) {
        enqueueObservationSync(store.stepSessionId, observation);
      }
    }
  }
}

function recordSimulationCompleted(endTime: number) {
  const store = useSimulationStore.getState();
  const observation = store.recordSegmentObservation({
    segment_id: 'simulation_completed',
    status: 'completed',
    sim_time: endTime,
    events: ['simulation_completed'],
  });

  if (observation) {
    store.appendLog('[Agent] simulation_completed', formatClock(endTime));
  }
}

function enqueueObservationSync(
  sessionId: string,
  observation: SegmentObservation,
) {
  observationSync = observationSync
    .then(() => submitStepObservation(sessionId, observation))
    .catch(() => undefined);
}

async function submitStepObservation(
  sessionId: string,
  observation: SegmentObservation,
) {
  const response = await fetch('/api/agent/step/observe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId,
      actionId: observation.action_id,
      segmentId: observation.segment_id,
      status: observation.status,
      simTime: observation.sim_time,
      events: observation.events,
      objects: observation.objects ?? {},
      error: observation.error,
    }),
  });

  if (!response.ok) {
    throw new Error('observation sync failed');
  }

  const data = await response.json() as { route?: string; message?: string };
  if (data.route === 'finish' || data.route === 'failed') {
    useSimulationStore.getState().appendLog(
      `[Agent] supervisor route: ${data.route}${data.message ? ` - ${data.message}` : ''}`,
      formatClock(observation.sim_time),
    );
  }
}

function formatClock(value: number) {
  const seconds = Math.max(0, Math.floor(value));
  const hh = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const mm = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
