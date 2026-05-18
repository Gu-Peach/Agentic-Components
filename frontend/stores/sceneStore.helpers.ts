'use client';

import type { CatalogDevice } from '@/types/catalog';
import type {
  DeviceInterfaceConfig,
  InterfaceConnection,
  SceneDevice,
} from '@/types/scene';

export function createSceneFromCatalogItem(
  device: CatalogDevice,
  index = 0,
  interfaceConfig?: DeviceInterfaceConfig | null,
): SceneDevice {
  return {
    id: `${device.id}-instance-${index}`,
    name: `${device.name} ${index + 1}`,
    type: device.deviceType,
    catalogId: device.id,
    modelUrl: device.modelUrl,
    interfaceUrl: device.interfaceUrl,
    interfaceConfig: interfaceConfig ?? null,
    preserveSceneCoordinates: shouldPreserveSceneCoordinates(device),
    modelBounds: null,
    modelAnchors: null,
    source: device.kind,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  };
}

export function nextSelectionAfterRemoval(
  devices: SceneDevice[],
  removedDeviceId: string,
  selectedDeviceId: string,
) {
  const remaining = devices.filter((device) => device.id !== removedDeviceId);
  if (selectedDeviceId && selectedDeviceId !== removedDeviceId) {
    return selectedDeviceId;
  }
  return remaining[0]?.id ?? '';
}

export function filterConnectionsByDevice(
  connections: InterfaceConnection[],
  removedDeviceId: string,
) {
  return connections.filter(
    (connection) =>
      connection.sourceDeviceId !== removedDeviceId
      && connection.targetDeviceId !== removedDeviceId,
  );
}

export async function loadDeviceInterfaceConfig(
  interfaceUrl: string | undefined,
): Promise<DeviceInterfaceConfig | null> {
  if (!interfaceUrl) {
    return null;
  }

  const response = await fetch(interfaceUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`接口配置加载失败：${interfaceUrl}`);
  }
  return (await response.json()) as DeviceInterfaceConfig;
}

export function isSameJson(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function shouldPreserveSceneCoordinates(device: CatalogDevice) {
  return (
    device.kind === 'layout'
    || device.name === 'Coordinated Robotic Transfer Unit'
    || device.name === 'Intelligent Storage and Logistics Line'
  );
}
