import { Object3D, Quaternion } from 'three';
import { buildIKFromDeviceConfig } from '@/lib/ik';
import type { BuiltIKResult } from '@/lib/ik';
import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import { applyStorageMotion, initStorageRuntime, restoreStorageRuntime, type StorageRuntime } from './storageMotion';
import { disposeWorkpieceProxy, ensureWorkpieceProxy, type WorkpieceProxy } from './workpieceProxy';
import { animateRobotSegment, finalizeRobotSegment } from './robotMotion';
import {
  attachWorkpieceToScene,
  moveWorkpiece,
  positionAtSegmentTime,
} from './runtimeWorkpiece';

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeQuaternion = InstanceType<typeof Quaternion>;

export type Runtime = {
  segmentKey: string;
  ik: BuiltIKResult | null;
  storage: StorageRuntime | null;
  workpieceAttached: boolean;
  restQuaternions: ThreeQuaternion[];
  proxy: WorkpieceProxy | null;
  robotWaypoints: VectorPoint[] | null;
};

export const emptyRuntime: Runtime = { segmentKey: '', ik: null, storage: null, workpieceAttached: false, restQuaternions: [], proxy: null, robotWaypoints: null };

export function initRuntime(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  segmentKey: string,
  proxy: WorkpieceProxy | null,
): Runtime {
  const runtime: Runtime = {
    ...emptyRuntime,
    segmentKey,
    proxy: ensureWorkpieceProxy(scene, plan.workpiece_node_name, proxy),
  };

  if (segment.algorithm === 'robot_arm_ik') {
    const config = plan.device_configs?.[segment.device_id];
    const ik = config ? buildIKFromDeviceConfig(config, scene) : null;
    if (ik) {
      scene.add(ik.containerGroup);
      runtime.ik = ik;
      runtime.restQuaternions = ik.ikChain.urdfJoints.map((node) => node.quaternion.clone());
    }
  }

  if (segment.algorithm === 'smart_storage_grid') {
    runtime.storage = initStorageRuntime(scene, plan.device_configs?.[segment.device_id]);
    attachWorkpieceToScene(scene, plan, runtime);
  }

  if (segment.algorithm === 'conveyor_linear') {
    attachWorkpieceToScene(scene, plan, runtime);
  }

  return runtime;
}

export function animateRuntime(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
  elapsed: number,
) {
  if (segment.waypoints.length < 2) return;
  if (segment.algorithm === 'robot_arm_ik') {
    animateRobotSegment(scene, plan, segment, runtime, elapsed);
  } else if (segment.algorithm === 'smart_storage_grid') {
    if (runtime.storage) {
      applyStorageMotion(segment, runtime.storage, elapsed);
    }
    moveWorkpiece(scene, plan, runtime, positionAtSegmentTime(segment, elapsed));
  } else if (segment.algorithm === 'conveyor_linear') {
    moveWorkpiece(scene, plan, runtime, positionAtSegmentTime(segment, elapsed));
  }
}

export function cleanupRuntime(
  scene: ThreeObject3D,
  runtime: Runtime,
  workpieceNodeName: string | undefined,
  disposeProxy: boolean,
) {
  if (runtime.workpieceAttached) {
    const workpiece = runtime.proxy?.object
      ?? scene.getObjectByName(workpieceNodeName ?? '');
    if (workpiece) scene.attach(workpiece);
  }

  restoreStorageRuntime(runtime.storage);
  if (runtime.ik) {
    runtime.ik.ikChain.urdfJoints.forEach((node, index) => {
      const saved = runtime.restQuaternions[index];
      if (saved) node.quaternion.copy(saved);
    });
    scene.remove(runtime.ik.containerGroup);
  }

  if (disposeProxy) {
    disposeWorkpieceProxy(scene, runtime.proxy);
  }
}

export function finalizeRuntime(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
) {
  finalizeRobotSegment(scene, plan, segment, runtime);
}

export function findActiveSegment(segments: ExecutionSegment[], elapsed: number) {
  return segments.find(
    (segment) => elapsed >= segment.planned_start && elapsed <= segment.planned_end,
  );
}

export function getSegmentKey(segment: ExecutionSegment) {
  return segment.id
    ?? segment.action_id
    ?? `${segment.device_id}-${segment.planned_start}-${segment.planned_end}`;
}
