import type { SceneLayoutDocument } from '@/types/process';
import type { InterfaceConnection, SceneDevice } from '@/types/scene';

const ROBOT_PLACE_HEIGHT = 1;

export function exportSceneLayout(
  sceneName: string,
  devices: SceneDevice[],
  connections: InterfaceConnection[],
): SceneLayoutDocument {
  const workpiece = devices.find((device) => device.type === 'workpiece');

  return {
    schemaVersion: 'scene-layout/v1',
    metadata: {
      id: `scene-${Date.now()}`,
      name: sceneName,
      description: 'Workspace scene layout for process composition agent.',
      createdAt: new Date().toISOString(),
      unit: 'meter',
    },
    layout: {
      sceneSource: devices[0]?.source ?? 'mock',
      devices: devices.map((device) => ({
        id: device.id,
        name: device.name,
        type: device.type,
        catalogId: device.catalogId,
        modelUrl: device.modelUrl,
        interfaceUrl: device.interfaceUrl,
        source: device.source,
        transform: device.transform,
      })),
    },
    processFlow: {
      description: 'Current process-flow composition in the Interface workspace.',
      connections,
    },
    simulation: {
      workpieceDeviceId: workpiece?.id ?? null,
      workpieceNodeName: workpiece?.interfaceConfig?.rootNodeName ?? null,
      executionPolicy: {
        conveyorAlwaysRunsEntryToExit: true,
        robotPlaceHeight: ROBOT_PLACE_HEIGHT,
        robotUsesRuntimeEndEffectorStart: true,
      },
      interfaceCoordinateMode: 'world',
    },
  };
}

export function sceneLayoutConnections(sceneLayout: SceneLayoutDocument) {
  return [...(sceneLayout.processFlow.connections ?? [])];
}

export function formatProcessFlowBrief(sceneLayout: SceneLayoutDocument) {
  const connections = sceneLayout.processFlow.connections;
  if (!connections.length) {
    return 'No process-flow connections.';
  }

  return connections
    .map(
      (connection) =>
        `${connection.sourceDeviceId}.${connection.sourceInterface} -> ${connection.targetDeviceId}.${connection.targetInterface}`,
    )
    .join('\n');
}
