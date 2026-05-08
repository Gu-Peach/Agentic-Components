'use client';

import { useRef, type PointerEvent } from 'react';
import { Unplug } from 'lucide-react';
import type { InterfacePoint, SceneDevice } from '@/types/scene';
import { getInterfacePorts } from '@/components/properties/interfaceUtils';
import {
  clampNodePosition,
  NODE_HEIGHT,
  NODE_WIDTH,
  type NodePosition,
} from '@/components/properties/interfaceCanvasLayout';

type PendingLink = {
  deviceId: string;
  interfaceName: string;
};

type InterfaceNodeProps = {
  device: SceneDevice;
  isSelected: boolean;
  position: NodePosition;
  pendingLink: PendingLink | null;
  onInterfaceClick: (deviceId: string, point: InterfacePoint) => void;
  onNodePositionChange: (deviceId: string, position: NodePosition) => void;
  onDisconnect: (deviceId: string, interfaceName: string) => void;
};

type DragState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
};

export function InterfaceNode({
  device,
  isSelected,
  position,
  pendingLink,
  onInterfaceClick,
  onNodePositionChange,
  onDisconnect,
}: InterfaceNodeProps) {
  const points = getInterfacePorts(device);
  const dragState = useRef<DragState | null>(null);

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    dragState.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: position.x,
      startY: position.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    onNodePositionChange(
      device.id,
      clampNodePosition({
        x: drag.startX + event.clientX - drag.startClientX,
        y: drag.startY + event.clientY - drag.startClientY,
      }),
    );
  }

  function clearDrag(event: PointerEvent<HTMLElement>) {
    if (dragState.current?.pointerId !== event.pointerId) {
      return;
    }

    dragState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section
      className={`absolute cursor-grab rounded-sm border bg-[#c5f1ff] text-[#19313a] shadow-[0_0_0_3px_rgba(0,136,125,0.45)] touch-none active:cursor-grabbing ${
        isSelected ? 'border-[#7ff4ff]' : 'border-[#00887d]'
      }`}
      onPointerCancel={clearDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearDrag}
      style={{ height: NODE_HEIGHT, left: position.x, top: position.y, width: NODE_WIDTH }}
    >
      <div className='flex h-full items-center gap-2 p-2'>
        <div className='grid h-9 w-9 place-items-center rounded bg-[#9fe1fb] text-[10px] font-semibold'>
          IO
        </div>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-[11px] font-semibold'>{device.name}</div>
          <div className='mt-1 text-[9px] uppercase tracking-wide text-[#42636c]'>
            {device.type}
          </div>
        </div>
      </div>
      {points.map((point) => (
        <InterfacePort
          key={point.name}
          device={device}
          isPending={
            pendingLink?.deviceId === device.id && pendingLink.interfaceName === point.name
          }
          onDisconnect={onDisconnect}
          onInterfaceClick={onInterfaceClick}
          point={point}
        />
      ))}
    </section>
  );
}

function InterfacePort({
  device,
  point,
  isPending,
  onInterfaceClick,
  onDisconnect,
}: {
  device: SceneDevice;
  point: InterfacePoint;
  isPending: boolean;
  onInterfaceClick: (deviceId: string, point: InterfacePoint) => void;
  onDisconnect: (deviceId: string, interfaceName: string) => void;
}) {
  const side = portSide(point);

  return (
    <div
      className={`absolute flex items-center gap-1 ${side === 'left' ? '-left-7' : '-right-7'}`}
      style={{ top: portTop(point) }}
    >
      {side === 'right' ? (
        <PortButton device={device} isPending={isPending} onClick={onInterfaceClick} point={point} />
      ) : null}
      <span className='rounded-sm border border-[#7ff4ff] bg-[#182126] px-1.5 py-0.5 text-[10px] font-semibold text-[#d8faff]'>
        {point.displayName ?? point.name}
      </span>
      {side === 'left' ? (
        <PortButton device={device} isPending={isPending} onClick={onInterfaceClick} point={point} />
      ) : null}
      <button
        className='grid h-4 w-4 place-items-center rounded-sm bg-[#20282d] text-[#b7cad1] hover:text-[#ffbc8a]'
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => onDisconnect(device.id, point.name)}
        type='button'
      >
        <Unplug size={10} />
      </button>
    </div>
  );
}

function PortButton({
  device,
  point,
  isPending,
  onClick,
}: {
  device: SceneDevice;
  point: InterfacePoint;
  isPending: boolean;
  onClick: (deviceId: string, point: InterfacePoint) => void;
}) {
  return (
    <button
      className={`h-3 w-3 rounded-full border ${
        isPending ? 'border-[#fff176] bg-[#fff176]' : 'border-[#7ff4ff] bg-[#0f2026]'
      }`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={() => onClick(device.id, point)}
      type='button'
    />
  );
}

function portSide(point: InterfacePoint) {
  const name = point.name.toLowerCase();
  return point.direction === 'in' || name.includes('in') || name.includes('entry')
    ? 'left'
    : 'right';
}

function portTop(point: InterfacePoint) {
  return point.direction === 'in' ? 26 : 44;
}
