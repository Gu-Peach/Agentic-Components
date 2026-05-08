export type DeviceType = 'conveyor' | 'robot' | 'lift' | 'storage' | 'workpiece';

export type SceneSource = 'component' | 'layout' | 'mock';

export type TransformTuple = [number, number, number];

export type InterfaceBounds = {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
};

export type InterfaceAnchorMap = Record<string, { x: number; y: number; z: number }>;

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
  interfaceUrl?: string;
  interfaceConfig?: DeviceInterfaceConfig | null;
  preserveSceneCoordinates?: boolean;
  modelBounds?: InterfaceBounds | null;
  modelAnchors?: InterfaceAnchorMap | null;
  source: SceneSource;
  transform: DeviceTransform;
};

export type InterfacePoint = {
  name: string;
  displayName?: string;
  direction?: string;
  origin?: {
    x: number;
    y: number;
    z: number;
  };
  source?: string;
  description?: string;
};

export type DeviceInterfaceConfig = {
  templateVersion?: number;
  type: string;
  displayName?: string;
  description?: string;
  rootNodeName?: string;
  urdf?: {
    interfaceJointName?: string;
    joints: {
      name: string;
      nodeName: string;
      type: string;
      axis: { x: number; y: number; z: number };
      limit?: { lower: number; upper: number };
    }[];
  };
  interfaces?: InterfacePoint[];
  interface?: {
    name: string;
    jointName: string;
    description?: string;
  };
  transfer?: {
    contentType: string;
    from: string;
    to: string;
    description?: string;
  };
};

export type InterfaceConnection = {
  id: string;
  sourceDeviceId: string;
  sourceInterface: string;
  targetDeviceId: string;
  targetInterface: string;
};
