'use client';

import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Object3D, Vector3 } from 'three';
import type { SceneDevice } from '@/types/scene';

type ModelAssetProps = {
  device: SceneDevice;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
};

type ThreeObject3D = InstanceType<typeof Object3D>;

const TARGET_MODEL_SIZE = 6;

function SelectionRing() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[2.2, 2.5, 48]} />
      <meshBasicMaterial color='#4da3ff' transparent opacity={0.85} />
    </mesh>
  );
}

export function ModelFallback({
  device,
  isSelected,
  onSelect,
}: ModelAssetProps) {
  const color =
    device.type === 'robot'
      ? '#8ad2ef'
      : device.type === 'lift'
        ? '#d8af1d'
        : device.type === 'conveyor'
          ? '#b7b7b7'
          : '#7a7a7a';

  return (
    <mesh onClick={() => onSelect(device.id)}>
      <boxGeometry args={device.type === 'conveyor' ? [4, 0.3, 1.2] : [1.5, 1.5, 1.5]} />
      <meshStandardMaterial color={color} emissive={isSelected ? '#4da3ff' : '#000000'} />
    </mesh>
  );
}

function GLTFAsset({ device, isSelected, onSelect }: ModelAssetProps) {
  const gltf = useGLTF(device.modelUrl ?? '');
  const normalizedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.name = device.name;
    enableModelShadows(clone);

    if (device.preserveSceneCoordinates) {
      clone.position.set(0, 0, 0);
      clone.scale.set(1, 1, 1);
      return clone;
    }

    const bounds = new Box3().setFromObject(clone);
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const min = bounds.min.clone();
    const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
    const uniformScale = TARGET_MODEL_SIZE / maxAxis;

    clone.scale.setScalar(uniformScale);
    clone.position.set(
      -center.x * uniformScale,
      -min.y * uniformScale,
      -center.z * uniformScale,
    );
    return clone;
  }, [device.name, device.preserveSceneCoordinates, gltf.scene]);

  return (
    <>
      <primitive object={normalizedScene} onClick={() => onSelect(device.id)} />
      {isSelected ? <SelectionRing /> : null}
    </>
  );
}

function enableModelShadows(root: ThreeObject3D) {
  root.traverse((node: ThreeObject3D) => {
    if ((node as ThreeObject3D & { isMesh?: boolean }).isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
}

export function ModelAsset(props: ModelAssetProps) {
  if (!props.device.modelUrl) {
    return <ModelFallback {...props} />;
  }

  return (
    <Suspense fallback={<ModelFallback {...props} />}>
      <GLTFAsset {...props} />
    </Suspense>
  );
}
