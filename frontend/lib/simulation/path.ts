import type { VectorPoint } from './types';

export function computeSegmentLengths(waypoints: VectorPoint[]) {
  const lengths: number[] = [];
  let totalLength = 0;

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const length = distance(waypoints[index], waypoints[index + 1]);
    lengths.push(length);
    totalLength += length;
  }

  return { lengths, totalLength };
}

export function interpolateByDistance(
  waypoints: VectorPoint[],
  lengths: number[],
  distanceOnPath: number,
): VectorPoint {
  let traversed = 0;

  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const length = lengths[index];
    if (distanceOnPath <= traversed + length) {
      const local = length > 0 ? (distanceOnPath - traversed) / length : 0;
      return lerpPoint(waypoints[index], waypoints[index + 1], local);
    }
    traversed += length;
  }

  return waypoints[waypoints.length - 1];
}

export function waypointIndexForDistance(
  lengths: number[],
  distanceOnPath: number,
) {
  let traversed = 0;
  let waypointIndex = 0;

  for (let index = 0; index < lengths.length; index += 1) {
    if (distanceOnPath > traversed + lengths[index]) {
      traversed += lengths[index];
      waypointIndex = index + 1;
    } else {
      break;
    }
  }

  return waypointIndex;
}

function lerpPoint(from: VectorPoint, to: VectorPoint, t: number): VectorPoint {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    z: from.z + (to.z - from.z) * t,
  };
}

function distance(from: VectorPoint, to: VectorPoint) {
  return Math.sqrt(
    (to.x - from.x) ** 2
      + (to.y - from.y) ** 2
      + (to.z - from.z) ** 2,
  );
}
