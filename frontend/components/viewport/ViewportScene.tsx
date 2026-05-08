'use client';

import { useRef } from 'react';
import { Environment, Grid, OrbitControls } from '@react-three/drei';
import { ModelInstance } from '@/components/viewport/ModelInstance';
import { AgentSimulationAnimator } from '@/components/viewport/simulation/AgentSimulationAnimator';
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
      <color attach='background' args={['#ffffff']} />
      <ambientLight intensity={0.5} />
      <directionalLight intensity={1} position={[10, 10, 5]} castShadow />
      <Grid
        args={[60, 60]}
        cellColor='#d4d4d4'
        cellSize={1}
        fadeDistance={50}
        fadeStrength={1}
        sectionColor='#b8b8b8'
        sectionSize={5}
      />
      <mesh position={[0, -0.02, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color='#ffffff' />
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
      <AgentSimulationAnimator />
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
      <Environment preset='sunset' />
    </>
  );
}
