'use client';

import type { InterfaceConnection, InterfacePoint, SceneDevice } from '@/types/scene';
import { InterfaceNode } from '@/components/properties/InterfaceNode';
import { getDeviceInterfaces } from '@/components/properties/interfaceUtils';
import {
  measureCanvas,
  NODE_WIDTH,
  type NodePosition,
} from '@/components/properties/interfaceCanvasLayout';

type PendingLink = {
  deviceId: string;
  interfaceName: string;
};

type InterfaceCanvasProps = {
  devices: SceneDevice[];
  connections: InterfaceConnection[];
  nodePositions: Record<string, NodePosition>;
  pendingLink: PendingLink | null;
  selectedDeviceId: string;
  isExpanded?: boolean;
  onInterfaceClick: (deviceId: string, point: InterfacePoint) => void;
  onNodePositionChange: (deviceId: string, position: NodePosition) => void;
  onDisconnect: (deviceId: string, interfaceName: string) => void;
};

type PortRef = {
  deviceId: string;
  interfaceName: string;
};

export function InterfaceCanvas({
  devices,
  connections,
  nodePositions,
  pendingLink,
  selectedDeviceId,
  isExpanded = false,
  onInterfaceClick,
  onNodePositionChange,
  onDisconnect,
}: InterfaceCanvasProps) {
  const canvasSize = measureCanvas(nodePositions);

  return (
    <div
      className={`relative overflow-auto border border-[var(--border-strong)] bg-[#101214] ${
        isExpanded ? 'h-[72vh]' : 'h-[360px]'
      }`}
    >
      <div className='absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px]' />
      <div className='relative' style={{ height: canvasSize.height, width: canvasSize.width }}>
        <ConnectionLayer
          connections={connections}
          devices={devices}
          nodePositions={nodePositions}
        />
        {devices.map((device) => (
          <InterfaceNode
            key={device.id}
            device={device}
            isSelected={device.id === selectedDeviceId}
            onDisconnect={onDisconnect}
            onInterfaceClick={onInterfaceClick}
            onNodePositionChange={onNodePositionChange}
            pendingLink={pendingLink}
            position={nodePositions[device.id] ?? { x: 0, y: 0 }}
          />
        ))}
      </div>
    </div>
  );
}

function ConnectionLayer({
  connections,
  devices,
  nodePositions,
}: {
  connections: InterfaceConnection[];
  devices: SceneDevice[];
  nodePositions: Record<string, NodePosition>;
}) {
  return (
    <svg className='pointer-events-none absolute inset-0 h-full w-full'>
      {connections.map((connection) => {
        const start = portCenter(devices, nodePositions, {
          deviceId: connection.sourceDeviceId,
          interfaceName: connection.sourceInterface,
        });
        const end = portCenter(devices, nodePositions, {
          deviceId: connection.targetDeviceId,
          interfaceName: connection.targetInterface,
        });
        if (!start || !end) return null;
        const mid = (start.x + end.x) / 2;
        return (
          <path
            key={connection.id}
            d={`M ${start.x} ${start.y} C ${mid} ${start.y}, ${mid} ${end.y}, ${end.x} ${end.y}`}
            fill='none'
            stroke='#8fb6c6'
            strokeWidth='2'
          />
        );
      })}
    </svg>
  );
}

function portCenter(
  devices: SceneDevice[],
  nodePositions: Record<string, NodePosition>,
  ref: PortRef,
) {
  const device = devices.find((item) => item.id === ref.deviceId);
  const position = nodePositions[ref.deviceId];
  if (!device || !position) return null;
  const points = getDeviceInterfaces(device);
  const point = points.find((item) => item.name === ref.interfaceName);
  const side = point ? portSide(point) : 'right';
  return {
    x: position.x + (side === 'left' ? 0 : NODE_WIDTH),
    y:
      position.y
      + 32
      + Math.max(0, points.findIndex((item) => item.name === ref.interfaceName)) * 18,
  };
}

function portSide(point: InterfacePoint) {
  const name = point.name.toLowerCase();
  return point.direction === 'in' || name.includes('in') || name.includes('entry')
    ? 'left'
    : 'right';
}
