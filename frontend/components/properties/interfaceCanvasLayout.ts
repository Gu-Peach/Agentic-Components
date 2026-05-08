'use client';

import type { SceneDevice } from '@/types/scene';

export type NodePosition = {
  x: number;
  y: number;
};

export const NODE_WIDTH = 154;
export const NODE_HEIGHT = 78;

const X_GAP = 112;
const Y_GAP = 34;
const LEFT_PADDING = 36;
const TOP_PADDING = 72;
const MIN_PADDING = 12;

export function mergeNodePositions(
  devices: SceneDevice[],
  current: Record<string, NodePosition>,
) {
  const defaults = buildDefaultNodePositions(devices);
  const validIds = new Set(devices.map((device) => device.id));
  const next: Record<string, NodePosition> = {};

  for (const [deviceId, position] of Object.entries(current)) {
    if (validIds.has(deviceId)) {
      next[deviceId] = clampNodePosition(position);
    }
  }

  for (const [deviceId, position] of Object.entries(defaults)) {
    if (!next[deviceId]) {
      next[deviceId] = position;
    }
  }

  return next;
}

export function measureCanvas(nodePositions: Record<string, NodePosition>) {
  const positions = Object.values(nodePositions);
  const maxX = positions.length ? Math.max(...positions.map((position) => position.x)) : 0;
  const maxY = positions.length ? Math.max(...positions.map((position) => position.y)) : 0;

  return {
    width: Math.max(780, maxX + NODE_WIDTH + LEFT_PADDING),
    height: Math.max(300, maxY + NODE_HEIGHT + TOP_PADDING),
  };
}

export function clampNodePosition(position: NodePosition): NodePosition {
  return {
    x: Math.max(MIN_PADDING, Math.round(position.x)),
    y: Math.max(MIN_PADDING, Math.round(position.y)),
  };
}

function buildDefaultNodePositions(devices: SceneDevice[]) {
  return Object.fromEntries(
    devices.map((device, index) => [
      device.id,
      {
        x: LEFT_PADDING + index * (NODE_WIDTH + X_GAP),
        y: TOP_PADDING + (index % 2) * (NODE_HEIGHT + Y_GAP),
      },
    ]),
  );
}
