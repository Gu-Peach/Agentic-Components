import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import type { InterfaceConnection, SceneDevice } from '@/types/scene';
import { getDeviceInterfaces, resolveInterfacePoint } from '@/lib/interfaces/interfacePorts';
import {
  addPoint,
  buildTerminalSegments,
  fallbackPoint,
  resolveOutgoingHandoffPoint,
  resolvePlacementTarget,
  resolveWorkpieceGripOffset,
  toWorldPoint,
} from '@/lib/interfaces/interfacePlanHelpers';

const DEFAULT_SEGMENT_DURATION = 3;
const ROBOT_APPROACH_HEIGHT = 0.1;

export function buildInterfaceExecutionPlan(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
): ExecutionPlan | null {
  const primarySegments = connections
    .map((connection, index) => toExecutionSegment(devices, connections, connection, index))
    .filter((segment): segment is ExecutionSegment => Boolean(segment));
  const terminalSegments = buildTerminalSegments(devices, connections, primarySegments.length);
  const segments = [...primarySegments, ...terminalSegments];

  if (!segments.length) {
    return null;
  }

  return {
    segments,
    workpiece_node_name: resolveWorkpieceNodeName(devices),
    device_configs: Object.fromEntries(
      devices.map((device) => [device.id, toDeviceConfig(device)]),
    ),
  };
}

function toExecutionSegment(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
  connection: InterfaceConnection,
  index: number,
): ExecutionSegment | null {
  const sourceDevice = devices.find((device) => device.id === connection.sourceDeviceId);
  const targetDevice = devices.find((device) => device.id === connection.targetDeviceId);
  if (!sourceDevice || !targetDevice) return null;

  const sourcePoint = resolveInterfacePoint(sourceDevice, connection.sourceInterface);
  const targetPoint = resolveInterfacePoint(targetDevice, connection.targetInterface);
  const waypoints = resolveSegmentWaypoints(
    devices,
    connections,
    sourceDevice,
    targetDevice,
    sourcePoint,
    targetPoint,
    connection,
  );
  const plannedStart = index * DEFAULT_SEGMENT_DURATION;
  const placementTarget = resolvePlacementTarget(targetDevice, targetPoint);

  return {
    id: `interface-flow-${index + 1}`,
    device_id: sourceDevice.id,
    device_type: sourceDevice.type,
    segment_name: `${sourceDevice.name}.${connection.sourceInterface}`,
    algorithm: sourceDevice.type === 'robot' ? 'robot_arm_ik' : 'conveyor_linear',
    planned_start: plannedStart,
    planned_end: plannedStart + DEFAULT_SEGMENT_DURATION,
    waypoints,
    placementTarget: sourceDevice.type === 'robot' ? placementTarget : undefined,
  };
}

function resolveSegmentWaypoints(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
  sourceDevice: SceneDevice,
  targetDevice: SceneDevice,
  sourcePoint: ReturnType<typeof resolveInterfacePoint>,
  targetPoint: ReturnType<typeof resolveInterfacePoint>,
  connection: InterfaceConnection,
): VectorPoint[] {
  const transfer = sourceDevice.interfaceConfig?.transfer;
  const transferStart = transfer
    ? resolveInterfacePoint(sourceDevice, transfer.from)
    : undefined;
  const transferEnd = transfer
    ? resolveInterfacePoint(sourceDevice, transfer.to)
    : undefined;
  const robotPickupPoint = resolveRobotPickupPoint(
    devices,
    connections,
    sourceDevice,
    connection,
  );
  const start = toWorldPoint(sourceDevice, transferStart ?? sourcePoint)
    ?? fallbackPoint(sourceDevice);
  const placementTarget = resolvePlacementTarget(targetDevice, targetPoint);
  const end = toWorldPoint(sourceDevice, transferEnd) ?? placementTarget;

  if (sourceDevice.type === 'robot') {
    return [
      robotPickupPoint ?? start,
      liftPoint(placementTarget),
    ];
  }

  return [start, end];
}

function resolveRobotPickupPoint(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
  sourceDevice: SceneDevice,
  currentConnection: InterfaceConnection,
) {
  if (sourceDevice.type !== 'robot') {
    return null;
  }

  const incomingConnection = connections.find(
    (connection) =>
      connection.targetDeviceId === sourceDevice.id && connection.id !== currentConnection.id,
  );
  if (!incomingConnection) {
    return null;
  }

  const incomingSourceDevice = devices.find(
    (device) => device.id === incomingConnection.sourceDeviceId,
  );
  if (!incomingSourceDevice) {
    return null;
  }

  const handoffPoint = resolveOutgoingHandoffPoint(incomingSourceDevice, incomingConnection);
  const workpieceGripOffset = resolveWorkpieceGripOffset(devices);

  return handoffPoint && workpieceGripOffset
    ? addPoint(handoffPoint, workpieceGripOffset)
    : handoffPoint;
}

function toDeviceConfig(device: SceneDevice) {
  const config = device.interfaceConfig;
  const keyPoints = getDeviceInterfaces(device)
    .filter((point) => point.origin)
    .map((point) => ({ name: point.name, origin: point.origin as VectorPoint }));

  return {
    id: device.id,
    type: config?.type ?? device.type,
    rootNodeName: config?.rootNodeName,
    keyPoints,
    urdf: config?.urdf,
  };
}

function resolveWorkpieceNodeName(devices: SceneDevice[]): string | undefined {
  return devices.find((device) => device.type === 'workpiece')?.interfaceConfig?.rootNodeName;
}

function liftPoint(point: VectorPoint): VectorPoint {
  return {
    x: point.x,
    y: point.y + ROBOT_APPROACH_HEIGHT,
    z: point.z,
  };
}
