import { getInterfaceCoordinate } from '@/lib/interfaces/interfaceCoordinates';
import { resolveInterfacePoint } from '@/lib/interfaces/interfacePorts';
import type { ExecutionSegment, VectorPoint } from '@/lib/simulation/types';
import type { InterfaceConnection, SceneDevice } from '@/types/scene';

const DEFAULT_SEGMENT_DURATION = 3;

export function buildTerminalSegments(
  devices: SceneDevice[],
  connections: InterfaceConnection[],
  offset: number,
) {
  const terminalTargets = devices
    .filter((device) => Boolean(device.interfaceConfig?.transfer))
    .filter((device) => !connections.some((connection) => connection.sourceDeviceId === device.id));

  return terminalTargets.map((device, index) => toTerminalSegment(device, offset + index));
}

export function resolveOutgoingHandoffPoint(
  sourceDevice: SceneDevice,
  connection: InterfaceConnection,
) {
  const transfer = sourceDevice.interfaceConfig?.transfer;
  const outgoingPoint = transfer
    ? resolveInterfacePoint(sourceDevice, transfer.to)
    : resolveInterfacePoint(sourceDevice, connection.sourceInterface);

  return toWorldPoint(sourceDevice, outgoingPoint);
}

export function resolveWorkpieceGripOffset(devices: SceneDevice[]) {
  const workpiece = devices.find((device) => device.type === 'workpiece');
  if (!workpiece) return null;

  const bottom = getInterfaceCoordinate(
    workpiece,
    { name: 'bottom', source: 'bounding_box_bottom_center' },
    'World',
  );
  const top = getInterfaceCoordinate(
    workpiece,
    { name: 'top', source: 'bounding_box_top_center' },
    'World',
  );
  if (!bottom || !top) return null;

  return {
    x: top.x - bottom.x,
    y: top.y - bottom.y,
    z: top.z - bottom.z,
  };
}

export function resolvePlacementTarget(
  targetDevice: SceneDevice,
  targetPoint: ReturnType<typeof resolveInterfacePoint>,
) {
  return toWorldPoint(targetDevice, targetPoint) ?? fallbackPoint(targetDevice);
}

export function toWorldPoint(
  device: SceneDevice,
  point: ReturnType<typeof resolveInterfacePoint>,
): VectorPoint | null {
  return point ? getInterfaceCoordinate(device, point, 'World') : null;
}

export function fallbackPoint(device: SceneDevice): VectorPoint {
  return {
    x: device.transform.position[0],
    y: device.transform.position[1],
    z: device.transform.position[2],
  };
}

export function addPoint(base: VectorPoint, offset: VectorPoint): VectorPoint {
  return {
    x: base.x + offset.x,
    y: base.y + offset.y,
    z: base.z + offset.z,
  };
}

function toTerminalSegment(device: SceneDevice, index: number): ExecutionSegment {
  const transfer = device.interfaceConfig?.transfer;
  const entryPoint = transfer
    ? resolveInterfacePoint(device, transfer.from)
    : undefined;
  const exitPoint = transfer
    ? resolveInterfacePoint(device, transfer.to)
    : undefined;
  const start = toWorldPoint(device, entryPoint) ?? fallbackPoint(device);
  const end = toWorldPoint(device, exitPoint) ?? start;
  const plannedStart = index * DEFAULT_SEGMENT_DURATION;

  return {
    id: `interface-flow-terminal-${index + 1}`,
    device_id: device.id,
    device_type: device.type,
    segment_name: `${device.name}.terminal_transfer`,
    algorithm: 'conveyor_linear',
    planned_start: plannedStart,
    planned_end: plannedStart + DEFAULT_SEGMENT_DURATION,
    waypoints: [start, end],
  };
}
