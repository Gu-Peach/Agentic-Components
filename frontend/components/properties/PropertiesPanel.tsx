'use client';

import { useMemo, useState } from 'react';
import { Lock, MapPin, Tag } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';

const coordinateModes = ['世界', '父系坐标系', '物体'] as const;

const defaultFields = {
  robot: [
    ['名称', 'ARC-2000i #2'],
    ['物料', 'dark_grey'],
    ['可视', '已启用'],
    ['BOM', 'Visual Components ARC-2000i'],
    ['类别', 'Robots'],
    ['Axis1', '0'],
    ['Axis2', '-22.584'],
    ['Axis3', '27.359'],
    ['Axis4', '0'],
    ['Axis5', '50.226'],
    ['Axis6', '0'],
  ],
  conveyor: [
    ['名称', 'Conveyor Feed 01'],
    ['长度', '1000'],
    ['宽度', '600'],
    ['高度', '800'],
    ['速度', '200 mm/s'],
  ],
  lift: [
    ['名称', 'Lift Shuttle 01'],
    ['nodeName', 'LiftNode'],
    ['carrierNodeName', 'Carrier_00'],
    ['速度', '0.5 m/s'],
  ],
  storage: [
    ['名称', 'Storage Rack A'],
    ['货格数', '8'],
    ['分配策略', 'FIFO'],
  ],
} as const;

const simulationFields = {
  robot: [
    ['执行器', 'Executor'],
    ['工作区', 'WorkSpace'],
    ['信号动作', 'SignalAction'],
    ['PDF 导出水平', '完成'],
    ['模拟水平', '详情'],
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
    useState<(typeof coordinateModes)[number]>('世界');
  const selected =
    devices.find((device) => device.id === selectedDeviceId) ?? devices[0];

  const parameterRows = useMemo(() => {
    return activeTab === 'default'
      ? defaultFields[selected.type]
      : simulationFields[selected.type];
  }, [activeTab, selected.type]);

  return (
    <aside className='flex h-full flex-col bg-[var(--bg-panel)]'>
      <div className='flex h-11 items-center justify-between bg-[var(--bg-accent)] px-3 text-[var(--text-primary)]'>
        <h2 className='text-sm font-semibold'>组件属性</h2>
        <div className='flex items-center gap-2 text-[var(--text-secondary)]'>
          <Tag size={14} />
          <Lock size={14} />
        </div>
      </div>
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
          默认
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
    </aside>
  );
}
