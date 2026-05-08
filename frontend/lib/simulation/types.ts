export type VectorPoint = {
  x: number;
  y: number;
  z: number;
};

export type JointLimit = {
  lower: number;
  upper: number;
};

export type UrdfJointConfig = {
  name: string;
  nodeName: string;
  type: string;
  axis: VectorPoint;
  limit?: JointLimit;
};

export type DeviceConfig = {
  id: string;
  type: string;
  rootNodeName?: string;
  carrierNodeName?: string;
  keyPoints?: { name: string; origin: VectorPoint }[];
  motion?: {
    rootAxis?: 'x' | 'y' | 'z';
    carrierAxis?: 'x' | 'y' | 'z';
  };
  trajectoryConfig?: { liftHeight?: number; speed?: number };
  urdf?: {
    joints: UrdfJointConfig[];
    endEffectorNodeName?: string;
  };
};

export type ExecutionSegment = {
  id?: string;
  action_id?: string;
  device_id: string;
  device_type?: string;
  segment_name?: string;
  algorithm: string;
  planned_start: number;
  planned_end: number;
  waypoints: VectorPoint[];
  placementTarget?: VectorPoint;
  motionData?: {
    rootOffset?: number;
    carrierOffset?: number;
    rootAxis?: 'x' | 'y' | 'z';
    carrierAxis?: 'x' | 'y' | 'z';
  };
};

export type ExecutionPlan = {
  segments: ExecutionSegment[];
  workpiece_node_name?: string;
  device_configs?: Record<string, DeviceConfig>;
};

export type AgentResultEvent = {
  id: string;
  type: string;
  time: number;
  source?: string;
  event?: string;
  text: string;
};

export type SegmentObservation = {
  type: 'step_observation';
  action_id?: string;
  segment_id?: string;
  status: 'completed' | 'failed';
  sim_time: number;
  events: string[];
  objects?: Record<string, unknown>;
  error?: string;
  recordedAt: number;
};
