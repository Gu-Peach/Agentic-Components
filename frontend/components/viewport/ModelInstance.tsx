'use client';

import { useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { Group } from 'three';
import { ModelAsset } from '@/components/viewport/ModelAsset';
import { toRadians, transformFromObject } from '@/components/viewport/modelUtils';
import type { InterfaceBounds, SceneDevice } from '@/types/scene';

type OrbitControlsHandle = {
  enabled: boolean;
};

type ThreeGroup = InstanceType<typeof Group>;

type ModelInstanceProps = {
  device: SceneDevice;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
  onTransformCommit: (
    deviceId: string,
    transform: SceneDevice['transform'],
  ) => void;
  onAnchorsChange: (
    deviceId: string,
    anchors: Record<string, { x: number; y: number; z: number }> | null,
  ) => void;
  onBoundsChange: (
    deviceId: string,
    bounds: InterfaceBounds | null,
  ) => void;
  controlsRef: React.RefObject<OrbitControlsHandle | null>;
  transformMode: 'translate' | 'rotate' | 'scale';
};

export function ModelInstance({
  device,
  isSelected,
  onSelect,
  onTransformCommit,
  onAnchorsChange,
  onBoundsChange,
  controlsRef,
  transformMode,
}: ModelInstanceProps) {
  const groupRef = useRef<ThreeGroup>(null);

  function commitTransform() {
    if (groupRef.current) {
      onTransformCommit(device.id, transformFromObject(groupRef.current));
    }
  }

  return (
    <>
      <group
        ref={groupRef}
        position={device.transform.position}
        rotation={toRadians(device.transform.rotation)}
        scale={device.transform.scale}
      >
        <ModelAsset
          device={device}
          isSelected={isSelected}
          onAnchorsChange={onAnchorsChange}
          onBoundsChange={onBoundsChange}
          onSelect={onSelect}
        />
      </group>
      {isSelected ? (
        <TransformControls
          mode={transformMode}
          object={groupRef}
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

            commitTransform();
          }}
          onObjectChange={commitTransform}
        />
      ) : null}
    </>
  );
}
