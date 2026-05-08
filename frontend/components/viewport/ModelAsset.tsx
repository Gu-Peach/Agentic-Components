'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Object3D, Vector3 } from 'three';
import type { InterfaceBounds, SceneDevice } from '@/types/scene';

type ModelAssetProps = {
  device: SceneDevice;
  isSelected: boolean;
  onSelect: (deviceId: string) => void;
  onAnchorsChange?: (
    deviceId: string,
    anchors: Record<string, { x: number; y: number; z: number }> | null,
  ) => void;
  onBoundsChange?: (deviceId: string, bounds: InterfaceBounds | null) => void;
};

type ThreeObject3D = InstanceType<typeof Object3D>;

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

function GLTFAsset({
  device,
  onAnchorsChange,
  isSelected,
  onBoundsChange,
  onSelect,
}: ModelAssetProps) {
  const gltf = useGLTF(device.modelUrl ?? '');
  const scene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    clone.name = device.name;
    enableModelShadows(clone);
    return clone;
  }, [device.name, gltf.scene]);
  const bounds = useMemo(() => measureModelBounds(scene), [scene]);
  const anchors = useMemo(
    () => measureModelAnchors(scene, device.interfaceConfig),
    [device.interfaceConfig, scene],
  );

  useEffect(() => {
    onBoundsChange?.(device.id, bounds);
  }, [bounds, device.id, onBoundsChange]);

  useEffect(() => {
    onAnchorsChange?.(device.id, anchors);
  }, [anchors, device.id, onAnchorsChange]);

  return (
    <>
      <primitive object={scene} onClick={() => onSelect(device.id)} />
      {isSelected ? <SelectionRing /> : null}
    </>
  );
}

function measureModelBounds(root: ThreeObject3D): InterfaceBounds | null {
  const bounds = new Box3().setFromObject(root);
  if (bounds.isEmpty()) {
    return null;
  }

  return {
    min: vectorPoint(bounds.min),
    max: vectorPoint(bounds.max),
  };
}

function measureModelAnchors(
  root: ThreeObject3D,
  interfaceConfig: SceneDevice['interfaceConfig'],
): Record<string, { x: number; y: number; z: number }> | null {
  const anchorNames = collectAnchorNames(interfaceConfig);

  if (!anchorNames.length) {
    return null;
  }

  root.updateWorldMatrix(true, true);

  const anchors = Object.fromEntries(
    anchorNames.flatMap((name) => {
      const target = root.getObjectByName(name);
      if (!target) {
        return [];
      }

      const local = root.worldToLocal(target.getWorldPosition(new Vector3()).clone());
      return [[name, vectorPoint(local)]];
    }),
  );

  return Object.keys(anchors).length ? anchors : null;
}

function collectAnchorNames(interfaceConfig: SceneDevice['interfaceConfig']) {
  if (!interfaceConfig) {
    return [];
  }

  const interfaceSources = (interfaceConfig.interfaces ?? [])
    .map((point) => point.source)
    .filter((source): source is string =>
      Boolean(
        source
        && source !== 'bounding_box_bottom_center'
        && source !== 'bounding_box_top_center',
      ),
    );
  const toolJointName = interfaceConfig.interface?.jointName
    ?? interfaceConfig.urdf?.interfaceJointName
    ?? interfaceConfig.urdf?.joints.at(-1)?.name;
  const toolNodeName = toolJointName
    ? interfaceConfig.urdf?.joints.find((joint) => joint.name === toolJointName)?.nodeName
    : undefined;

  return [...new Set([...interfaceSources, ...(toolNodeName ? [toolNodeName] : [])])];
}

function vectorPoint(vector: InstanceType<typeof Vector3>) {
  return {
    x: Number(vector.x.toFixed(3)),
    y: Number(vector.y.toFixed(3)),
    z: Number(vector.z.toFixed(3)),
  };
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
