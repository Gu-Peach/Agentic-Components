import { Object3D, Vector3 } from 'three';
import {
  computeSegmentLengths,
  interpolateByDistance,
} from '@/lib/simulation/path';
import type { DeviceConfig, ExecutionSegment } from '@/lib/simulation/types';

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeVector3 = InstanceType<typeof Vector3>;

export type StorageRuntime = {
  rootNode: ThreeObject3D;
  carrierNode: ThreeObject3D;
  rootStart: ThreeVector3;
  carrierStart: ThreeVector3;
};

export function initStorageRuntime(
  scene: ThreeObject3D,
  config: DeviceConfig | undefined,
) {
  if (!config?.rootNodeName || !config.carrierNodeName) {
    return null;
  }

  const rootNode = scene.getObjectByName(config.rootNodeName);
  const carrierNode = scene.getObjectByName(config.carrierNodeName);
  if (!rootNode || !carrierNode) {
    return null;
  }

  return {
    rootNode,
    carrierNode,
    rootStart: rootNode.position.clone(),
    carrierStart: carrierNode.position.clone(),
  };
}

export function applyStorageMotion(
  segment: ExecutionSegment,
  runtime: StorageRuntime,
  elapsed: number,
) {
  const start = segment.waypoints[0];
  const current = positionAtSegmentTime(segment, elapsed);
  const motion = segment.motionData;
  const rootAxis = motion?.rootAxis ?? 'x';
  const carrierAxis = motion?.carrierAxis ?? 'y';

  runtime.rootNode.position.copy(runtime.rootStart);
  runtime.carrierNode.position.copy(runtime.carrierStart);
  runtime.rootNode.position[rootAxis] =
    runtime.rootStart[rootAxis] + current[rootAxis] - start[rootAxis];
  runtime.carrierNode.position[carrierAxis] =
    runtime.carrierStart[carrierAxis] + current[carrierAxis] - start[carrierAxis];
}

export function restoreStorageRuntime(runtime: StorageRuntime | null) {
  if (!runtime) {
    return;
  }
  runtime.rootNode.position.copy(runtime.rootStart);
  runtime.carrierNode.position.copy(runtime.carrierStart);
}

function positionAtSegmentTime(segment: ExecutionSegment, elapsed: number) {
  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  const duration = Math.max(segment.planned_end - segment.planned_start, 0.001);
  const progress = Math.min(Math.max((elapsed - segment.planned_start) / duration, 0), 1);
  return interpolateByDistance(segment.waypoints, lengths, totalLength * progress);
}
