'use client';

import { useMemo, useState } from 'react';
import { Lock, MapPin, Tag } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';

const coordinateModes = ['World', 'Parent', 'Local'] as const;

const defaultFields = {
  robot: [
    ['Name', 'ARC-2000i #2'],
    ['Material', 'dark_grey'],
    ['Visible', 'Enabled'],
    ['BOM', 'Visual Components ARC-2000i'],
    ['Category', 'Robots'],
    ['Axis1', '0'],
    ['Axis2', '-22.584'],
    ['Axis3', '27.359'],
    ['Axis4', '0'],
    ['Axis5', '50.226'],
    ['Axis6', '0'],
  ],
  conveyor: [
    ['Name', 'Conveyor Feed 01'],
    ['Length', '1000'],
    ['Width', '600'],
    ['Height', '800'],
    ['Speed', '200 mm/s'],
  ],
  lift: [
    ['Name', 'Lift Shuttle 01'],
    ['nodeName', 'LiftNode'],
    ['carrierNodeName', 'Carrier_00'],
    ['Speed', '0.5 m/s'],
  ],
  storage: [
    ['Name', 'Storage Rack A'],
    ['Cells', '8'],
    ['Allocation', 'FIFO'],
  ],
} as const;

const simulationFields = {
  robot: [
    ['Executor', 'Executor'],
    ['Workspace', 'WorkSpace'],
    ['Signal Action', 'SignalAction'],
    ['PDF Export Level', 'Complete'],
    ['Simulation Level', 'Detailed'],
  ],
  conveyor: [
    ['StartOffset', '0'],
    ['EndOffset', '0'],
  ],
  lift: [
    ['rootAxis', 'x'],
    ['carrierAxis', 'y'],
    ['rootRange', '-4.142 ~ 0.858'],
    ['carrierRange', '0.185 ~ 3.160'],
  ],
  storage: [
    ['cells', 'A1 ~ A8'],
    ['allocation', 'FIFO'],
  ],
} as const;

export function PropertiesPanel() {
  const { devices, selectedDeviceId } = useSceneStore();
  const [activeTab, setActiveTab] = useState<'default' | 'simulation'>('default');
  const [coordinateMode, setCoordinateMode] =
    useState<(typeof coordinateModes)[number]>('World');
  const selected =
    devices.find((device) => device.id === selectedDeviceId) ?? devices[0];

  const parameterRows = useMemo(() => {
    if (!selected) {
      return [] as readonly (readonly [string, string])[];
    }

    return activeTab === 'default'
      ? defaultFields[selected.type]
      : simulationFields[selected.type];
  }, [activeTab, selected]);

  return (
    <aside className='flex h-full flex-col bg-[var(--bg-panel)]'>
      <div className='flex h-11 items-center justify-between bg-[var(--bg-accent)] px-3 text-[var(--text-primary)]'>
        <h2 className='text-sm font-semibold'>Properties</h2>
        <div className='flex items-center gap-2 text-[var(--text-secondary)]'>
          <Tag size={14} />
          <Lock size={14} />
        </div>
      </div>
      {selected ? (
        <>
          <div className='border-b border-[var(--border-soft)] px-3 py-3'>
            <div className='mb-3 flex items-center gap-2 text-sm text-[var(--text-accent)]'>
              <MapPin size={14} />
              <span>{selected.name}</span>
            </div>
            <div className='mb-3 flex flex-wrap gap-3 text-xs text-[var(--text-secondary)]'>
              {coordinateModes.map((mode) => (
                <label key={mode} className='flex items-center gap-1.5'>
                  <input
                    checked={coordinateMode === mode}
                    className='accent-[var(--accent-line)]'
                    name='coordinate-mode'
                    onChange={() => setCoordinateMode(mode)}
                    type='radio'
                  />
                  {mode}
                </label>
              ))}
            </div>
            <div className='grid grid-cols-3 gap-2'>
              {[
                ['X', selected.transform.position[0]],
                ['Y', selected.transform.position[1]],
                ['Z', selected.transform.position[2]],
                ['Rx', selected.transform.rotation[0]],
                ['Ry', selected.transform.rotation[1]],
                ['Rz', selected.transform.rotation[2]],
              ].map(([label, value]) => (
                <label key={label} className='text-xs text-[var(--text-secondary)]'>
                  <span className='mb-1 block'>{label}</span>
                  <input
                    className='h-7 w-full border border-[var(--border-strong)] bg-[var(--bg-input)] px-2 text-[13px] text-[var(--text-dark)] outline-none'
                    readOnly
                    value={value}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className='flex border-b border-[var(--border-soft)] text-sm'>
            <button
              className={`flex-1 border-r border-[var(--border-soft)] px-3 py-2 ${
                activeTab === 'default'
                  ? 'bg-[var(--bg-panel-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
              onClick={() => setActiveTab('default')}
              type='button'
            >
              Default
            </button>
            <button
              className={`flex-1 px-3 py-2 ${
                activeTab === 'simulation'
                  ? 'bg-[var(--bg-panel-hover)] text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)]'
              }`}
              onClick={() => setActiveTab('simulation')}
              type='button'
            >
              Simulation
            </button>
          </div>
          <div className='flex-1 overflow-auto px-3 py-3'>
            <div className='space-y-px border border-[var(--border-strong)] bg-[var(--border-strong)]'>
              {parameterRows.map(([label, value]) => (
                <div
                  key={label}
                  className='grid grid-cols-[120px_1fr] items-center bg-[var(--bg-panel)] text-sm'
                >
                  <div className='px-3 py-2 text-[var(--text-secondary)]'>{label}</div>
                  <div className='border-l border-[var(--border-strong)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text-dark)]'>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className='flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--text-secondary)]'>
          No devices in the scene yet. Load a model from the catalog first.
        </div>
      )}
    </aside>
  );
}
