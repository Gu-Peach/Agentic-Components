'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import {
  animateRuntime,
  cleanupRuntime,
  emptyRuntime,
  findActiveSegment,
  getSegmentKey,
  initRuntime,
  type Runtime,
} from './animationRuntime';

export function AgentSimulationAnimator() {
  const { scene } = useThree();
  const runtimeRef = useRef<Runtime>({ ...emptyRuntime });

  useFrame(() => {
    const store = useSimulationStore.getState();
    const plan = store.executionPlan;

    if (!plan) {
      cleanupRuntime(scene, runtimeRef.current, undefined, true);
      runtimeRef.current = { ...emptyRuntime };
      return;
    }

    const segment = findActiveSegment(plan.segments, store.elapsedSeconds);
    if (!segment) {
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name, true);
      runtimeRef.current = { ...emptyRuntime };
      return;
    }

    const segmentKey = getSegmentKey(segment);
    if (runtimeRef.current.segmentKey !== segmentKey) {
      const proxy = runtimeRef.current.proxy;
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name, false);
      runtimeRef.current = initRuntime(scene, plan, segment, segmentKey, proxy);
    }

    animateRuntime(scene, plan, segment, runtimeRef.current, store.elapsedSeconds);
  });

  return null;
}
