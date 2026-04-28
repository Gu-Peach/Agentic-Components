'use client';

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import type { Group } from 'three';
import { ModelAsset } from '@/components/viewport/ModelAsset';
import { toRadians, transformFromObject } from '@/components/viewport/modelUtils';
import type { SceneDevice } from '@/types/scene';

type OrbitControlsHandle = {
  enabled: boolean;
};

type ModelInstanceProps = {
  device: SceneDevice;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
  onTransformCommit: (
    deviceId: string,
    transform: SceneDevice['transform'],
  ) => void;
  controlsRef: React.RefObject<OrbitControlsHandle | null>;
  transformMode: 'translate' | 'rotate' | 'scale';
};

export function ModelInstance({
  device,
  isSelected,
  onSelect,
  onTransformCommit,
  controlsRef,
  transformMode,
}: ModelInstanceProps) {
  const groupRef = useRef<Group>(null);
  const content = (
    <group
      ref={groupRef}
      position={device.transform.position}
      rotation={toRadians(device.transform.rotation)}
      scale={device.transform.scale}
    >
      <ModelAsset
        device={device}
        isSelected={isSelected}
        onSelect={onSelect}
      />
    </group>
  );

  if (!isSelected) {
    return content;
  }

  return (
    <TransformControls
      mode={transformMode}
      onMouseDown={() => {
        const controls = controlsRef.current;

        if (controls) {
          controls.enabled = false;
        }
      }}
      onMouseUp={() => {
        const controls = controlsRef.current;

        if (controls) {
          controls.enabled = true;
        }

        if (groupRef.current) {
          onTransformCommit(device.id, transformFromObject(groupRef.current));
        }
      }}
    >
      {content}
    </TransformControls>
  );
}
