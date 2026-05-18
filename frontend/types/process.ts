import type { DeviceType, InterfaceConnection, SceneSource } from '@/types/scene';

export type ProcessLayoutDevice = {
  id: string;
  name: string;
  type: DeviceType;
  catalogId: string;
  modelUrl?: string;
  interfaceUrl?: string;
  source: SceneSource;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  };
};

export type SceneLayoutDocument = {
  schemaVersion: 'scene-layout/v1';
  metadata: {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    unit: 'meter';
  };
  layout: {
    sceneSource: SceneSource;
    devices: ProcessLayoutDevice[];
  };
  processFlow: {
    description: string;
    connections: InterfaceConnection[];
  };
  simulation: {
    workpieceDeviceId: string | null;
    workpieceNodeName: string | null;
    executionPolicy: {
      conveyorAlwaysRunsEntryToExit: true;
      robotPlaceHeight: number;
      robotUsesRuntimeEndEffectorStart: true;
    };
    interfaceCoordinateMode: 'world';
  };
};

export type ProcessQuestionOption = {
  label: string;
  value: string;
};

export type ProcessClarificationQuestion = {
  id: string;
  question: string;
  options?: ProcessQuestionOption[];
};

export type ProcessCompositionResult = {
  type: 'process_composition_result';
  status: 'clarification_required' | 'proposal_ready' | 'ready' | 'failed';
  stage?: 'pre_planning' | 'post_planning' | 'confirmed';
  summary?: string;
  context?: Record<string, string>;
  reasoningSummary?: string[];
  warnings?: string[];
  questions?: ProcessClarificationQuestion[];
  connectionsPreview?: string[];
  sceneLayout?: SceneLayoutDocument;
};
