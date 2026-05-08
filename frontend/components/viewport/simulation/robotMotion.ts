import { Object3D, Vector3 } from 'three';
import { computeSegmentLengths, interpolateByDistance } from '@/lib/simulation/path';
import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import type { Runtime } from './animationRuntime';
import { attachWorkpieceToScene, moveWorkpiece, segmentProgress } from './runtimeWorkpiece';

type ThreeObject3D = InstanceType<typeof Object3D>;

export function animateRobotSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
  elapsed: number,
) {
  if (!runtime.ik) return;

  const waypoints = ensureRobotWaypoints(segment, runtime);
  if (waypoints.length < 2) return;

  const { lengths, totalLength } = computeSegmentLengths(waypoints);
  const distance = totalLength * segmentProgress(segment, elapsed);
  const position = interpolateByDistance(waypoints, lengths, distance);
  const pickupDistance = lengths[0] ?? 0;

  runtime.ik.ikTarget.position.set(position.x, position.y, position.z);
  runtime.ik.ikSolver.solve();

  if (!runtime.workpieceAttached && distance >= Math.max(pickupDistance - 0.001, 0)) {
    attachWorkpieceToEndEffector(scene, plan, runtime);
  }

  if (segmentProgress(segment, elapsed) >= 1) {
    finalizeRobotSegment(scene, plan, segment, runtime);
  }
}

export function finalizeRobotSegment(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  segment: ExecutionSegment,
  runtime: Runtime,
) {
  if (segment.algorithm !== 'robot_arm_ik') return;

  const finalPoint = segment.placementTarget ?? segment.waypoints.at(-1);
  if (!finalPoint) return;

  if (runtime.workpieceAttached) {
    attachWorkpieceToScene(scene, plan, runtime);
    runtime.workpieceAttached = false;
  }

  moveWorkpiece(scene, plan, runtime, finalPoint);
}

function ensureRobotWaypoints(segment: ExecutionSegment, runtime: Runtime) {
  if (runtime.robotWaypoints) {
    return runtime.robotWaypoints;
  }

  const start = getEndEffectorWorldPosition(runtime);
  runtime.robotWaypoints = start ? [start, ...segment.waypoints] : segment.waypoints;
  return runtime.robotWaypoints;
}

function getEndEffectorWorldPosition(runtime: Runtime): VectorPoint | null {
  const endEffector = runtime.ik?.endEffectorNode ?? runtime.ik?.ikChain.endEffector;
  if (!endEffector) return null;

  const position = new Vector3();
  endEffector.getWorldPosition(position);
  return {
    x: position.x,
    y: position.y,
    z: position.z,
  };
}

function attachWorkpieceToEndEffector(
  scene: ThreeObject3D,
  plan: ExecutionPlan,
  runtime: Runtime,
) {
  const workpiece = runtime.proxy?.object
    ?? scene.getObjectByName(plan.workpiece_node_name ?? '');
  if (!workpiece || !runtime.ik?.endEffectorNode) return;

  runtime.ik.endEffectorNode.attach(workpiece);
  const proxy = runtime.proxy;
  if (proxy && proxy.object === workpiece) {
    workpiece.position.set(0, -proxy.size.y / 2, 0);
  }
  runtime.workpieceAttached = true;
}
