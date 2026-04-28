'use client';

import { MathUtils } from 'three';
import type { Object3D } from 'three';
import type { SceneDevice, TransformTuple } from '@/types/scene';

export function toRadians([x, y, z]: TransformTuple): TransformTuple {
  return [
    MathUtils.degToRad(x),
    MathUtils.degToRad(y),
    MathUtils.degToRad(z),
  ];
}

function toDegrees(radians: number) {
  return MathUtils.radToDeg(radians);
}

export function transformFromObject(object: Object3D): SceneDevice['transform'] {
  return {
    position: [
      Number(object.position.x.toFixed(3)),
      Number(object.position.y.toFixed(3)),
      Number(object.position.z.toFixed(3)),
    ],
    rotation: [
      Number(toDegrees(object.rotation.x).toFixed(3)),
      Number(toDegrees(object.rotation.y).toFixed(3)),
      Number(toDegrees(object.rotation.z).toFixed(3)),
    ],
    scale: [
      Number(object.scale.x.toFixed(3)),
      Number(object.scale.y.toFixed(3)),
      Number(object.scale.z.toFixed(3)),
    ],
  };
}
