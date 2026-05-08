import type { SceneDevice } from '@/types/scene';
import {
  formatInterfaceName,
  getFlowInterfacePointsForDevice,
} from '@/lib/interfaces/interfacePorts';

export function getInterfacePorts(device: SceneDevice) {
  return getFlowInterfacePointsForDevice(device);
}

export function formatConnection(
  connection: { targetDeviceId: string; targetInterface: string } | undefined,
  devices: SceneDevice[],
) {
  if (!connection?.targetDeviceId || !connection.targetInterface) return 'Unlinked';
  const target = devices.find((device) => device.id === connection.targetDeviceId);
  if (!target) {
    return 'Unknown / Unlinked';
  }

  return `${target.name} / ${formatInterfaceName(target, connection.targetInterface)}`;
}
