import {
  Box3,
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from 'three';
import type { VectorPoint } from '@/lib/simulation/types';

type ThreeObject3D = InstanceType<typeof Object3D>;
type ThreeMesh = InstanceType<typeof Mesh>;
type ThreeVector3 = InstanceType<typeof Vector3>;
type ThreeBox3 = InstanceType<typeof Box3>;

export type WorkpieceProxy = {
  object: ThreeMesh;
  source: ThreeObject3D;
  size: ThreeVector3;
  sourceVisible: boolean;
};

export function ensureWorkpieceProxy(
  scene: ThreeObject3D,
  nodeName: string | undefined,
  existing: WorkpieceProxy | null,
) {
  if (existing || !nodeName) {
    return existing;
  }

  const source = scene.getObjectByName(nodeName);
  if (!source) {
    return null;
  }

  const bounds = new Box3().setFromObject(source);
  const size = bounds.getSize(new Vector3());
  if (size.x <= 0 || size.y <= 0 || size.z <= 0) {
    return null;
  }

  const geometry = new BoxGeometry(size.x, size.y, size.z);
  const material = new MeshStandardMaterial({
    color: '#d8892f',
    roughness: 0.55,
    metalness: 0.08,
  });
  const object = new Mesh(geometry, material);
  object.name = `agent_workpiece_proxy_${nodeName}`;
  object.castShadow = true;
  object.receiveShadow = true;

  const bottomCenter = getBottomCenter(bounds);
  object.position.set(
    bottomCenter.x,
    bottomCenter.y + size.y / 2,
    bottomCenter.z,
  );

  const proxy = {
    object,
    source,
    size,
    sourceVisible: source.visible,
  };

  source.visible = false;
  scene.add(object);
  return proxy;
}

export function attachProxyToScene(
  scene: ThreeObject3D,
  proxy: WorkpieceProxy | null,
) {
  if (!proxy) {
    return null;
  }
  if (proxy.object.parent !== scene) {
    scene.attach(proxy.object);
  }
  return proxy.object;
}

export function setProxyBottomCenter(
  proxy: WorkpieceProxy,
  position: VectorPoint,
) {
  proxy.object.position.set(
    position.x,
    position.y + proxy.size.y / 2,
    position.z,
  );
}

export function disposeWorkpieceProxy(
  scene: ThreeObject3D,
  proxy: WorkpieceProxy | null,
) {
  if (!proxy) {
    return;
  }
  attachProxyToScene(scene, proxy);
  scene.remove(proxy.object);
  proxy.object.geometry.dispose();
  const material = proxy.object.material;
  if (Array.isArray(material)) {
    material.forEach((item) => item.dispose());
  } else {
    material.dispose();
  }
  proxy.source.visible = proxy.sourceVisible;
}

function getBottomCenter(bounds: ThreeBox3) {
  return {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: bounds.min.y,
    z: (bounds.min.z + bounds.max.z) / 2,
  };
}
