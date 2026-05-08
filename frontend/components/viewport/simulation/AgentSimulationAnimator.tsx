'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Object3D } from 'three';
import type { ExecutionPlan, ExecutionSegment } from '@/lib/simulation/types';
import { useSimulationStore } from '@/stores/simulationStore';
import {
  animateRuntime,
  cleanupRuntime,
  emptyRuntime,
  findActiveSegment,
  finalizeRuntime,
  getSegmentKey,
  initRuntime,
  type Runtime,
} from './animationRuntime';

type ThreeObject3D = InstanceType<typeof Object3D>;

export function AgentSimulationAnimator() {
  const { scene } = useThree();
  const runtimeRef = useRef<Runtime>({ ...emptyRuntime });
  const activePlanRef = useRef<ExecutionPlan | null>(null);
  const activeSegmentRef = useRef<ExecutionSegment | null>(null);

  useFrame(() => {
    const store = useSimulationStore.getState();
    const plan = store.executionPlan;

    if (!plan) {
      finalizeActiveSegment(scene, runtimeRef.current, activePlanRef.current, activeSegmentRef.current);
      cleanupRuntime(scene, runtimeRef.current, undefined, true);
      runtimeRef.current = { ...emptyRuntime };
      activePlanRef.current = null;
      activeSegmentRef.current = null;
      return;
    }

    const segment = findActiveSegment(plan.segments, store.elapsedSeconds);
    if (!segment) {
      finalizeActiveSegment(scene, runtimeRef.current, activePlanRef.current, activeSegmentRef.current);
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name, true);
      runtimeRef.current = { ...emptyRuntime };
      activePlanRef.current = null;
      activeSegmentRef.current = null;
      return;
    }

    const segmentKey = getSegmentKey(segment);
    if (runtimeRef.current.segmentKey !== segmentKey) {
      finalizeActiveSegment(scene, runtimeRef.current, activePlanRef.current, activeSegmentRef.current);
      const proxy = runtimeRef.current.proxy;
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name, false);
      runtimeRef.current = initRuntime(scene, plan, segment, segmentKey, proxy);
    }

    animateRuntime(scene, plan, segment, runtimeRef.current, store.elapsedSeconds);
    activePlanRef.current = plan;
    activeSegmentRef.current = segment;
  });

  return null;
}

function finalizeActiveSegment(
  scene: ThreeObject3D,
  runtime: Runtime,
  plan: ExecutionPlan | null,
  segment: ExecutionSegment | null,
) {
  if (!runtime.segmentKey || !plan || !segment) {
    return;
  }

  finalizeRuntime(scene, plan, segment, runtime);
}
