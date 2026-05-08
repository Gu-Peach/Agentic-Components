import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import type {
  InterfaceConnection,
  SceneDevice,
} from '@/types/scene';
import { getInterfaceCoordinate } from '@/lib/interfaces/interfaceCoordinates';
import { getDeviceInterfaces, resolveInterfacePoint } from '@/lib/interfaces/interfacePorts';

const DEFAULT_SEGMENT_DURATION = 3;

export function buildInterfaceExecutionPlan(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
): ExecutionPlan | null {
  const segments = connections
    .map((connection, index) => toExecutionSegment(devices, connection, index))
    .filter((segment): segment is ExecutionSegment => Boolean(segment));

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
  connection: InterfaceConnection,
  index: number,
): ExecutionSegment | null {
  const sourceDevice = devices.find((device) => device.id === connection.sourceDeviceId);
  const targetDevice = devices.find((device) => device.id === connection.targetDeviceId);
  if (!sourceDevice || !targetDevice) return null;

  const sourcePoint = resolveInterfacePoint(sourceDevice, connection.sourceInterface);
  const targetPoint = resolveInterfacePoint(targetDevice, connection.targetInterface);
  const [start, end] = resolveSegmentWaypoints(
    sourceDevice,
    targetDevice,
    sourcePoint,
    targetPoint,
  );
  const plannedStart = index * DEFAULT_SEGMENT_DURATION;

  return {
    id: `interface-flow-${index + 1}`,
    device_id: sourceDevice.id,
    device_type: sourceDevice.type,
    segment_name: `${sourceDevice.name}.${connection.sourceInterface}`,
    algorithm: sourceDevice.type === 'robot' ? 'robot_arm_ik' : 'conveyor_linear',
    planned_start: plannedStart,
    planned_end: plannedStart + DEFAULT_SEGMENT_DURATION,
    waypoints: [start, end],
  };
}

function resolveSegmentWaypoints(
  sourceDevice: SceneDevice,
  targetDevice: SceneDevice,
  sourcePoint: ReturnType<typeof resolveInterfacePoint>,
  targetPoint: ReturnType<typeof resolveInterfacePoint>,
): [VectorPoint, VectorPoint] {
  const transfer = sourceDevice.interfaceConfig?.transfer;
  const transferStart = transfer
    ? resolveInterfacePoint(sourceDevice, transfer.from)
    : undefined;
  const transferEnd = transfer
    ? resolveInterfacePoint(sourceDevice, transfer.to)
    : undefined;
  const start = toWorldPoint(sourceDevice, transferStart ?? sourcePoint)
    ?? fallbackPoint(sourceDevice);
  const end = toWorldPoint(sourceDevice, transferEnd)
    ?? toWorldPoint(targetDevice, targetPoint)
    ?? fallbackPoint(targetDevice);

  return [start, end];
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

function toWorldPoint(
  device: SceneDevice,
  point: ReturnType<typeof resolveInterfacePoint>,
): VectorPoint | null {
  return point ? getInterfaceCoordinate(device, point, 'World') : null;
}

function fallbackPoint(device: SceneDevice): VectorPoint {
  return {
    x: device.transform.position[0],
    y: device.transform.position[1],
    z: device.transform.position[2],
  };
}
