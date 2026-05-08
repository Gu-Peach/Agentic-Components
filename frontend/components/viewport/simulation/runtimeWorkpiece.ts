import { Object3D } from 'three';
import { computeSegmentLengths, interpolateByDistance } from '@/lib/simulation/path';
import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import { attachProxyToScene, setProxyBottomCenter } from './workpieceProxy';
import type { Runtime } from './animationRuntime';

type ThreeObject3D = InstanceType<typeof Object3D>;

export function moveWorkpiece(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  runtime: Runtime,
  position: VectorPoint,
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

export function attachWorkpieceToScene(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  runtime: Runtime,
) {
  if (attachProxyToScene(scene, runtime.proxy)) return;
  const workpiece = scene.getObjectByName(plan.workpiece_node_name ?? '');
  if (workpiece && workpiece.parent !== scene) scene.attach(workpiece);
}

export function positionAtSegmentTime(segment: ExecutionSegment, elapsed: number) {
  const { lengths, totalLength } = computeSegmentLengths(segment.waypoints);
  return interpolateByDistance(
    segment.waypoints,
    lengths,
    totalLength * segmentProgress(segment, elapsed),
  );
}

export function segmentProgress(segment: ExecutionSegment, elapsed: number) {
  const duration = Math.max(segment.planned_end - segment.planned_start, 0.001);
  return Math.min(Math.max((elapsed - segment.planned_start) / duration, 0), 1);
}
