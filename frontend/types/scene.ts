export type DeviceType = 'conveyor' | 'robot' | 'lift' | 'storage';

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
  transform: DeviceTransform;
};
