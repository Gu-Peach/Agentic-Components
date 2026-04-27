'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
  Environment,
  Grid,
  OrbitControls,
  useGLTF,
} from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  Box3,
  MathUtils,
  Vector3,
} from 'three';
import { useSceneStore } from '@/stores/sceneStore';
import type { SceneDevice } from '@/types/scene';

type ModelInstanceProps = {
  device: SceneDevice;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
};

const TARGET_MODEL_SIZE = 6;

function toRadians([x, y, z]: [number, number, number]) {
  return [
    MathUtils.degToRad(x),
    MathUtils.degToRad(y),
    MathUtils.degToRad(z),
  ] as [number, number, number];
}

function ModelFallback({
  device,
  isSelected,
  onSelect,
}: ModelInstanceProps) {
  const color =
    device.type === 'robot'
      ? '#8ad2ef'
      : device.type === 'lift'
        ? '#d8af1d'
        : device.type === 'conveyor'
          ? '#b7b7b7'
          : '#7a7a7a';

  return (
    <mesh
      onClick={() => onSelect(device.id)}
      position={device.transform.position}
      rotation={toRadians(device.transform.rotation)}
      scale={device.transform.scale}
    >
      <boxGeometry args={device.type === 'conveyor' ? [4, 0.3, 1.2] : [1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={color} emissive={isSelected ? '#4da3ff' : '#000000'} />
    </mesh>
  );
}

function SelectionRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[2.2, 2.5, 48]} />
      <meshBasicMaterial color='#4da3ff' transparent opacity={0.85} />
    </mesh>
  );
}

function GLTFModel({ device, isSelected, onSelect }: ModelInstanceProps) {
  const gltf = useGLTF(device.modelUrl ?? '');
  const normalizedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const uniformScale = TARGET_MODEL_SIZE / maxAxis;

    clone.position.sub(center);
    clone.scale.setScalar(uniformScale);
    return clone;
  }, [gltf.scene]);

  return (
    <group
      onClick={() => onSelect(device.id)}
      position={device.transform.position}
      rotation={toRadians(device.transform.rotation)}
      scale={device.transform.scale}
    >
      <primitive object={normalizedScene} />
      {isSelected ? <SelectionRing /> : null}
    </group>
  );
}

function ModelInstance(props: ModelInstanceProps) {
  if (!props.device.modelUrl) {
    return <ModelFallback {...props} />;
  }

  return (
    <Suspense fallback={<ModelFallback {...props} />}>
      <GLTFModel {...props} />
    </Suspense>
  );
}

type CameraRigProps = {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
};

function CameraRig({ controlsRef }: CameraRigProps) {
  const { camera } = useThree();
  const devices = useSceneStore((state) => state.devices);

  useEffect(() => {
    const focus = new Vector3(0, 0, 0);
    const distance = Math.max(10, TARGET_MODEL_SIZE * Math.max(1, devices.length * 0.7));

    camera.position.set(distance, distance * 0.7, distance);
    camera.lookAt(focus);
    camera.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(focus);
      controls.update();
    }
  }, [camera, controlsRef, devices]);

  return null;
}

export function ViewportScene() {
  const { devices, selectedDeviceId, selectDevice } = useSceneStore();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <>
      <CameraRig controlsRef={controlsRef} />
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
        />
      ))}
      <OrbitControls ref={controlsRef} enableDamping makeDefault />
      <Environment preset='warehouse' />
    </>
  );
}
