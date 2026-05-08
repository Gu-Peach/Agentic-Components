'use client';

import { useMemo, useState } from 'react';
import type { InterfacePoint, SceneDevice } from '@/types/scene';
import { InterfaceCanvas } from '@/components/properties/InterfaceCanvas';
import {
  ConnectionSummary,
  InterfaceToolbar,
} from '@/components/properties/InterfacePanelSections';
import {
  mergeNodePositions,
  type NodePosition,
} from '@/components/properties/interfaceCanvasLayout';
import { buildInterfaceExecutionPlan } from '@/lib/interfaces/interfacePlan';
import { formatConnection } from '@/components/properties/interfaceUtils';
import { useSceneStore } from '@/stores/sceneStore';
import { useSimulationStore } from '@/stores/simulationStore';

type PendingLink = {
  deviceId: string;
  interfaceName: string;
  label: string;
};

type InterfacePanelProps = {
  selectedDeviceId: string;
};

export function InterfacePanel({ selectedDeviceId }: InterfacePanelProps) {
  const { devices, interfaceConnections, updateInterfaceConnection } = useSceneStore();
  const { appendLog, setExecutionPlan } = useSimulationStore();
  const [pendingLink, setPendingLink] = useState<PendingLink | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(() =>
    mergeNodePositions(devices, {}),
  );

  const connectionSummary = useMemo(
    () =>
      interfaceConnections.map((connection) => ({
        id: connection.id,
        source: pendingLabel(devices, connection.sourceDeviceId, connection.sourceInterface),
        target: formatConnection(connection, devices),
      })),
    [devices, interfaceConnections],
  );
  const orderedDevices = useMemo(
    () =>
      [...devices].sort(
        (left, right) =>
          Number(right.id === selectedDeviceId) - Number(left.id === selectedDeviceId),
      ),
    [devices, selectedDeviceId],
  );
  const resolvedNodePositions = useMemo(
    () => mergeNodePositions(devices, nodePositions),
    [devices, nodePositions],
  );

  function updateNodePosition(deviceId: string, position: NodePosition) {
    setNodePositions((current) => ({
      ...mergeNodePositions(devices, current),
      [deviceId]: position,
    }));
  }

  function playInterfacePath() {
    const plan = buildInterfaceExecutionPlan(devices, interfaceConnections);
    if (!plan) {
      appendLog('[Interface] No interface path to play.');
      return;
    }

    setExecutionPlan(plan);
    appendLog(`[Interface] Started playback for ${plan.segments.length} interface segments.`);
  }

  function handleInterfaceClick(deviceId: string, point: InterfacePoint) {
    const label = point.displayName ?? point.name;

    if (!pendingLink) {
      setPendingLink({ deviceId, interfaceName: point.name, label });
      return;
    }

    if (pendingLink.deviceId === deviceId && pendingLink.interfaceName === point.name) {
      setPendingLink(null);
      return;
    }

    updateInterfaceConnection(
      pendingLink.deviceId,
      pendingLink.interfaceName,
      deviceId,
      point.name,
    );
    appendLog(`[Interface] ${pendingLink.label} -> ${label}`);
    setPendingLink(null);
  }

  function disconnect(deviceId: string, interfaceName: string) {
    updateInterfaceConnection(deviceId, interfaceName, '', '');
  }

  return (
    <div className='space-y-3'>
      <InterfaceToolbar
        isExpanded={false}
        pendingLabel={pendingLink?.label ?? null}
        onExpand={() => setIsExpanded(true)}
        onPlay={playInterfacePath}
      />
      <InterfaceCanvas
        connections={interfaceConnections}
        devices={orderedDevices}
        nodePositions={resolvedNodePositions}
        onDisconnect={disconnect}
        onInterfaceClick={handleInterfaceClick}
        onNodePositionChange={updateNodePosition}
        pendingLink={pendingLink}
        selectedDeviceId={selectedDeviceId}
      />
      <ConnectionSummary items={connectionSummary} />
      {isExpanded ? (
        <div className='fixed inset-0 z-40 bg-[rgba(0,0,0,0.72)] p-8'>
          <div className='mx-auto flex h-full max-w-7xl flex-col border border-[var(--accent-line)] bg-[var(--bg-panel)] shadow-[var(--shadow-panel)]'>
            <InterfaceToolbar
              isExpanded
              pendingLabel={pendingLink?.label ?? null}
              onExpand={() => setIsExpanded(false)}
              onPlay={playInterfacePath}
            />
            <div className='flex-1 p-3'>
              <InterfaceCanvas
                connections={interfaceConnections}
                devices={orderedDevices}
                isExpanded
                nodePositions={resolvedNodePositions}
                onDisconnect={disconnect}
                onInterfaceClick={handleInterfaceClick}
                onNodePositionChange={updateNodePosition}
                pendingLink={pendingLink}
                selectedDeviceId={selectedDeviceId}
              />
            </div>
            <div className='border-t border-[var(--border-soft)] p-3'>
              <ConnectionSummary items={connectionSummary} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function pendingLabel(devices: SceneDevice[], deviceId: string, interfaceName: string) {
  const device = devices.find((item) => item.id === deviceId);
  return `${device?.name ?? 'Unknown'} / ${interfaceName}`;
}
