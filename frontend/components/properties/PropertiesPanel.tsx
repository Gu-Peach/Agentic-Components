'use client';

import { useMemo, useState } from 'react';
import { Lock, MapPin, Tag } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';
import { InterfacePanel } from '@/components/properties/InterfacePanel';
import { defaultFields, simulationFields } from '@/components/properties/propertyFields';

const coordinateModes = ['World', 'Parent', 'Local'] as const;
const tabs = ['default', 'simulation', 'interface'] as const;
type PropertiesTab = (typeof tabs)[number];

export function PropertiesPanel() {
  const { devices, selectedDeviceId } = useSceneStore();
  const [activeTab, setActiveTab] = useState<PropertiesTab>('default');
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
      : activeTab === 'simulation'
        ? simulationFields[selected.type]
        : [];
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
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`flex-1 border-r border-[var(--border-soft)] px-3 py-2 capitalize last:border-r-0 ${
                  activeTab === tab
                    ? 'bg-[var(--bg-panel-hover)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)]'
                }`}
                onClick={() => setActiveTab(tab)}
                type='button'
              >
                {tab}
              </button>
            ))}
          </div>
          <div className='flex-1 overflow-auto px-3 py-3'>
            {activeTab === 'interface' ? (
              <InterfacePanel selectedDeviceId={selected.id} />
            ) : (
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
            )}
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
