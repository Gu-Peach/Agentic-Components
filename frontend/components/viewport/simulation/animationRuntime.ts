import { Object3D, Quaternion } from 'three';
import { buildIKFromDeviceConfig } from '@/lib/ik';
import type { BuiltIKResult } from '@/lib/ik';
import { computeSegmentLengths, interpolateByDistance, waypointIndexForDistance } from '@/lib/simulation/path';
import type { ExecutionPlan, ExecutionSegment } from '@/lib/simulation/types';
import { applyStorageMotion, initStorageRuntime, restoreStorageRuntime, type StorageRuntime } from './storageMotion';
import { attachProxyToScene, disposeWorkpieceProxy, ensureWorkpieceProxy, setProxyBottomCenter, type WorkpieceProxy } from './workpieceProxy';

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeQuaternion = InstanceType<typeof Quaternion>;

export type Runtime = {
  segmentKey: string;
  ik: BuiltIKResult | null;
  storage: StorageRuntime | null;
  workpieceAttached: boolean;
  restQuaternions: ThreeQuaternion[];
  proxy: WorkpieceProxy | null;
};

export const emptyRuntime: Runtime = { segmentKey: '', ik: null, storage: null, workpieceAttached: false, restQuaternions: [], proxy: null };

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

function animateRobotSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
  elapsed: number,
) {
  if (!runtime.ik) return;

  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  const progress = segmentProgress(segment, elapsed);
  const distance = totalLength * progress;
  const position = interpolateByDistance(segment.waypoints, lengths, distance);

  runtime.ik.ikTarget.position.set(position.x, position.y, position.z);
  runtime.ik.ikSolver.solve();

  const waypointIndex = waypointIndexForDistance(lengths, distance);
  if (!runtime.workpieceAttached && waypointIndex >= 1) {
    const workpiece = runtime.proxy?.object
      ?? scene.getObjectByName(plan.workpiece_node_name ?? '');
    if (workpiece && runtime.ik.endEffectorNode) {
      runtime.ik.endEffectorNode.attach(workpiece);
      runtime.workpieceAttached = true;
    }
  }

  if (runtime.workpieceAttached && progress >= 1) {
    attachWorkpieceToScene(scene, plan, runtime);
    runtime.workpieceAttached = false;
  }
}

function moveWorkpiece(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  runtime: Runtime,
  position: { x: number; y: number; z: number },
) {
  const proxy = attachProxyToScene(scene, runtime.proxy);
  if (proxy && runtime.proxy) {
    setProxyBottomCenter(runtime.proxy, position);
    return;
  }

  const workpiece = scene.getObjectByName(plan.workpiece_node_name ?? '');
  if (workpiece) {
    if (workpiece.parent !== scene) scene.attach(workpiece);
    workpiece.position.set(position.x, position.y, position.z);
  }
}

function attachWorkpieceToScene(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  runtime: Runtime,
) {
  if (attachProxyToScene(scene, runtime.proxy)) return;
  const workpiece = scene.getObjectByName(plan.workpiece_node_name ?? '');
  if (workpiece && workpiece.parent !== scene) scene.attach(workpiece);
}

function positionAtSegmentTime(segment: ExecutionSegment, elapsed: number) {
  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  return interpolateByDistance(
    segment.waypoints,
    lengths,
    totalLength * segmentProgress(segment, elapsed),
  );
}

function segmentProgress(segment: ExecutionSegment, elapsed: number) {
  const duration = Math.max(segment.planned_end - segment.planned_start, 0.001);
  return Math.min(Math.max((elapsed - segment.planned_start) / duration, 0), 1);
}
