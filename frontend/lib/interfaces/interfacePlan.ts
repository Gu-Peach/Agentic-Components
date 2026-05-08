import type { ExecutionPlan, ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import type {
  DeviceInterfaceConfig,
  InterfaceConnection,
  InterfacePoint,
  SceneDevice,
} from '@/types/scene';

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

  const sourcePoint = findInterfacePoint(sourceDevice, connection.sourceInterface);
  const targetPoint = findInterfacePoint(targetDevice, connection.targetInterface);
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
  sourcePoint: InterfacePoint | undefined,
  targetPoint: InterfacePoint | undefined,
): [VectorPoint, VectorPoint] {
  const transfer = sourceDevice.interfaceConfig?.transfer;
  const transferStart = transfer
    ? findInterfacePoint(sourceDevice, transfer.from)
    : undefined;
  const transferEnd = transfer
    ? findInterfacePoint(sourceDevice, transfer.to)
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

  return {
    id: device.id,
    type: config?.type ?? device.type,
    rootNodeName: config?.rootNodeName,
    keyPoints: config?.interfaces
      ?.filter((point) => point.origin)
      .map((point) => ({ name: point.name, origin: point.origin as VectorPoint })),
    urdf: config?.urdf,
  };
}

function resolveWorkpieceNodeName(devices: SceneDevice[]): string | undefined {
  return devices.find((device) => device.type === 'workpiece')?.interfaceConfig?.rootNodeName;
}

function findInterfacePoint(device: SceneDevice, interfaceName: string) {
  const config = device.interfaceConfig;
  if (!config) return undefined;
  return config.interfaces?.find((point) => point.name === interfaceName)
    ?? interfaceFromRobotConfig(config, interfaceName);
}

function interfaceFromRobotConfig(
  config: DeviceInterfaceConfig,
  interfaceName: string,
): InterfacePoint | undefined {
  if (!config.interface || config.interface.name !== interfaceName) return undefined;
  return {
    name: config.interface.name,
    source: config.interface.jointName,
    description: config.interface.description,
  };
}

function toWorldPoint(
  device: SceneDevice,
  point: InterfacePoint | undefined,
): VectorPoint | null {
  if (!point?.origin) return null;
  return {
    x: point.origin.x + device.transform.position[0],
    y: point.origin.y + device.transform.position[1],
    z: point.origin.z + device.transform.position[2],
  };
}

function fallbackPoint(device: SceneDevice): VectorPoint {
  return {
    x: device.transform.position[0],
    y: device.transform.position[1],
    z: device.transform.position[2],
  };
}
