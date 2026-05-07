'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Object3D, Quaternion } from 'three';
import { buildIKFromDeviceConfig } from '@/lib/ik';
import type { BuiltIKResult } from '@/lib/ik';
import {
  computeSegmentLengths,
  interpolateByDistance,
  waypointIndexForDistance,
} from '@/lib/simulation/path';
import type { ExecutionPlan, ExecutionSegment } from '@/lib/simulation/types';
import { useSimulationStore } from '@/stores/simulationStore';

type Runtime = {
  segmentKey: string;
  ik: BuiltIKResult | null;
  workpieceAttached: boolean;
  restQuaternions: ThreeQuaternion[];
};

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeQuaternion = InstanceType<typeof Quaternion>;

const emptyRuntime: Runtime = {
  segmentKey: '',
  ik: null,
  workpieceAttached: false,
  restQuaternions: [],
};

export function AgentSimulationAnimator() {
  const { scene } = useThree();
  const runtimeRef = useFrameRuntime();

  useFrame(() => {
    const store = useSimulationStore.getState();
    const plan = store.executionPlan;

    if (!plan) {
      cleanupRuntime(scene, runtimeRef.current, undefined);
      runtimeRef.current = { ...emptyRuntime };
      return;
    }

    const segment = findActiveSegment(plan.segments, store.elapsedSeconds);
    if (!segment) {
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name);
      runtimeRef.current = { ...emptyRuntime };
      return;
    }

    const segmentKey = getSegmentKey(segment);
    if (runtimeRef.current.segmentKey !== segmentKey) {
      cleanupRuntime(scene, runtimeRef.current, plan.workpiece_node_name);
      runtimeRef.current = initRuntime(scene, plan, segment, segmentKey);
    }

    animateSegment(scene, plan, segment, runtimeRef.current, store.elapsedSeconds);
  });

  return null;
}

function useFrameRuntime() {
  return useRef<Runtime>({ ...emptyRuntime });
}

function initRuntime(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  segmentKey: string,
): Runtime {
  const runtime: Runtime = { ...emptyRuntime, segmentKey };

  if (segment.algorithm === 'robot_arm_ik') {
    const config = plan.device_configs?.[segment.device_id];
    const ik = config ? buildIKFromDeviceConfig(config, scene) : null;

    if (ik) {
      scene.add(ik.containerGroup);
      runtime.ik = ik;
      runtime.restQuaternions = ik.ikChain.urdfJoints.map((node) =>
        node.quaternion.clone(),
      );
    }
  } else if (segment.algorithm === 'conveyor_linear') {
    attachWorkpieceToScene(scene, plan.workpiece_node_name);
  }

  return runtime;
}

function animateSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
  elapsed: number,
) {
  if (segment.waypoints.length < 2) {
    return;
  }

  if (segment.algorithm === 'robot_arm_ik') {
    animateRobotSegment(scene, plan, segment, runtime, elapsed);
    return;
  }

  if (segment.algorithm === 'conveyor_linear') {
    animateConveyorSegment(scene, plan, segment, elapsed);
  }
}

function animateConveyorSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  elapsed: number,
) {
  const workpiece = attachWorkpieceToScene(scene, plan.workpiece_node_name);
  if (!workpiece) {
    return;
  }

  const position = positionAtSegmentTime(segment, elapsed);
  workpiece.position.set(position.x, position.y, position.z);
}

function animateRobotSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
  elapsed: number,
) {
  if (!runtime.ik) {
    return;
  }

  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  const progress = segmentProgress(segment, elapsed);
  const distance = totalLength * progress;
  const position = interpolateByDistance(segment.waypoints, lengths, distance);

  runtime.ik.ikTarget.position.set(position.x, position.y, position.z);
  runtime.ik.ikSolver.solve();

  const waypointIndex = waypointIndexForDistance(lengths, distance);
  if (!runtime.workpieceAttached && waypointIndex >= 1) {
    const workpiece = scene.getObjectByName(plan.workpiece_node_name ?? '');
    if (workpiece && runtime.ik.endEffectorNode) {
      runtime.ik.endEffectorNode.attach(workpiece);
      runtime.workpieceAttached = true;
    }
  }

  if (runtime.workpieceAttached && progress >= 1) {
    attachWorkpieceToScene(scene, plan.workpiece_node_name);
    runtime.workpieceAttached = false;
  }
}

function positionAtSegmentTime(segment: ExecutionSegment, elapsed: number) {
  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  const distance = totalLength * segmentProgress(segment, elapsed);
  return interpolateByDistance(segment.waypoints, lengths, distance);
}

function segmentProgress(segment: ExecutionSegment, elapsed: number) {
  const duration = Math.max(segment.planned_end - segment.planned_start, 0.001);
  return Math.min(Math.max((elapsed - segment.planned_start) / duration, 0), 1);
}

function findActiveSegment(segments: ExecutionSegment[], elapsed: number) {
  return segments.find(
    (segment) => elapsed >= segment.planned_start && elapsed <= segment.planned_end,
  );
}

function cleanupRuntime(
  scene: ThreeObject3D,
  runtime: Runtime,
  workpieceNodeName: string | undefined,
) {
  if (runtime.workpieceAttached) {
    attachWorkpieceToScene(scene, workpieceNodeName);
  }

  if (runtime.ik) {
    runtime.ik.ikChain.urdfJoints.forEach((node, index) => {
      const saved = runtime.restQuaternions[index];
      if (saved) {
        node.quaternion.copy(saved);
      }
    });
    scene.remove(runtime.ik.containerGroup);
  }
}

function attachWorkpieceToScene(scene: ThreeObject3D, workpieceNodeName?: string) {
  if (!workpieceNodeName) {
    return null;
  }

  const workpiece = scene.getObjectByName(workpieceNodeName);
  if (workpiece && workpiece.parent !== scene) {
    scene.attach(workpiece);
  }

  return workpiece ?? null;
}

function getSegmentKey(segment: ExecutionSegment) {
  return segment.id
    ?? segment.action_id
    ?? `${segment.device_id}-${segment.planned_start}-${segment.planned_end}`;
}
