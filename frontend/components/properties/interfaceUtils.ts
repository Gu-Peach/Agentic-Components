import type { InterfacePoint, SceneDevice } from '@/types/scene';

export function getDeviceInterfaces(device: SceneDevice): InterfacePoint[] {
  const config = device.interfaceConfig;
  if (!config) return [];
  if (config.interfaces?.length) return config.interfaces;
  if (config.interface) {
    return [{
      name: config.interface.name,
      displayName: config.interface.name,
      source: config.interface.jointName,
      description: config.interface.description,
    }];
  }
  return [];
}

export function formatConnection(
  connection: { targetDeviceId: string; targetInterface: string } | undefined,
  devices: SceneDevice[],
) {
  if (!connection?.targetDeviceId || !connection.targetInterface) return 'Unlinked';
  const target = devices.find((device) => device.id === connection.targetDeviceId);
  return `${target?.name ?? 'Unknown'} / ${connection.targetInterface}`;
}
