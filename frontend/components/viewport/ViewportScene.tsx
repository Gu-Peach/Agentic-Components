'use client';

import { useRef } from 'react';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import { ModelInstance } from '@/components/viewport/ModelInstance';
import { useSceneStore } from '@/stores/sceneStore';

type OrbitControlsHandle = {
  enabled: boolean;
};

export function ViewportScene({
  transformMode,
}: {
  transformMode: 'translate' | 'rotate' | 'scale';
}) {
  const {
    devices,
    selectedDeviceId,
    selectDevice,
    updateDeviceTransform,
  } = useSceneStore();
  const controlsRef = useRef<OrbitControlsHandle | null>(null);

  return (
    <>
      <color attach='background' args={['#d5d2cb']} />
      <ambientLight intensity={1.25} />
      <directionalLight intensity={2.4} position={[12, 14, 10]} castShadow />
      <directionalLight intensity={0.7} position={[-8, 6, -4]} />
      <Grid
        args={[60, 60]}
        cellColor='#bdb8b0'
        cellSize={1}
        fadeDistance={50}
        fadeStrength={1}
        sectionColor='#96908a'
        sectionSize={5}
      />
      <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color='#d0ccc4' />
      </mesh>
      {devices.map((device) => (
        <ModelInstance
          key={device.id}
          device={device}
          isSelected={device.id === selectedDeviceId}
          onSelect={selectDevice}
          onTransformCommit={updateDeviceTransform}
          controlsRef={controlsRef}
          transformMode={transformMode}
        />
      ))}
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
      <Environment preset='warehouse' />
    </>
  );
}
