import { Euler, MathUtils, Vector3 } from 'three';
import type {
  InterfaceBounds,
  InterfacePoint,
  SceneDevice,
} from '@/types/scene';

export type InterfaceCoordinateMode = 'World' | 'Parent' | 'Local';

export function getInterfaceCoordinate(
  device: SceneDevice,
  point: InterfacePoint,
  mode: InterfaceCoordinateMode,
) {
  const localOrigin = resolveInterfaceOrigin(
    point,
    device.modelBounds,
    device.modelAnchors,
  );
  if (!localOrigin) {
    return null;
  }

  if (mode === 'Local') {
    return roundPoint(localOrigin);
  }

  const scaled = localOrigin.clone().multiply(
    new Vector3(...device.transform.scale),
  );
  const rotated = scaled.applyEuler(
    new Euler(
      MathUtils.degToRad(device.transform.rotation[0]),
      MathUtils.degToRad(device.transform.rotation[1]),
      MathUtils.degToRad(device.transform.rotation[2]),
      'XYZ',
    ),
  );
  const translated = rotated.add(new Vector3(...device.transform.position));
  return roundPoint(translated);
}

function resolveInterfaceOrigin(
  point: InterfacePoint,
  bounds: InterfaceBounds | null | undefined,
  anchors?: SceneDevice['modelAnchors'],
) {
  if (point.origin) {
    return new Vector3(point.origin.x, point.origin.y, point.origin.z);
  }

  if (point.source && anchors?.[point.source]) {
    const anchor = anchors[point.source];
    return new Vector3(anchor.x, anchor.y, anchor.z);
  }

  if (!bounds) {
    return null;
  }

  if (point.source === 'bounding_box_bottom_center') {
    return new Vector3(
      (bounds.min.x + bounds.max.x) / 2,
      bounds.min.y,
      (bounds.min.z + bounds.max.z) / 2,
    );
  }

  if (point.source === 'bounding_box_top_center') {
    return new Vector3(
      (bounds.min.x + bounds.max.x) / 2,
      bounds.max.y,
      (bounds.min.z + bounds.max.z) / 2,
    );
  }

  return null;
}

function roundPoint(vector: InstanceType<typeof Vector3>) {
  return {
    x: Number(vector.x.toFixed(3)),
    y: Number(vector.y.toFixed(3)),
    z: Number(vector.z.toFixed(3)),
  };
}
