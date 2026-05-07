export type DeviceType = 'conveyor' | 'robot' | 'lift' | 'storage';

export type SceneSource = 'component' | 'layout' | 'mock';

export type TransformTuple = [number, number, number];

export type DeviceTransform = {
  position: TransformTuple;
  rotation: TransformTuple;
  scale: TransformTuple;
};

export type SceneDevice = {
  id: string;
  name: string;
  type: DeviceType;
  catalogId: string;
  modelUrl?: string;
  preserveSceneCoordinates?: boolean;
  source: SceneSource;
  transform: DeviceTransform;
};
