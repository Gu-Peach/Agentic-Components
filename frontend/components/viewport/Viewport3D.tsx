'use client';

import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { SceneToolbar } from '@/components/viewport/SceneToolbar';
import { ViewportScene } from '@/components/viewport/ViewportScene';
import { useSceneStore } from '@/stores/sceneStore';

const sourceLabels = {
  mock: 'Mock',
  component: 'Component',
  layout: 'Layout',
} as const;

export function Viewport3D() {
  const {
    devices,
    selectedDeviceId,
    sceneLabel,
    sceneSource,
    isSceneLoading,
    loadError,
    selectDevice,
  } = useSceneStore();
  const [transformMode, setTransformMode] =
    useState<'translate' | 'rotate' | 'scale'>('translate');

  const sceneBadges = useMemo(
    () => [sceneLabel, `${devices.length} Models`, sourceLabels[sceneSource]],
    [devices.length, sceneLabel, sceneSource],
  );

  return (
    <section className='relative h-full overflow-hidden bg-white'>
      <div className='absolute left-6 top-6 z-10 flex gap-2'>
        {sceneBadges.map((badge, index) => (
          <span
            key={`${index}-${badge}`}
            className='border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.65)] px-2 py-1 text-xs text-[#444]'
          >
            {badge}
          </span>
        ))}
      </div>

      {loadError ? (
        <div className='absolute left-6 top-16 z-10 rounded border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.78)] px-3 py-2 text-xs text-[#444]'>
          {loadError}
        </div>
      ) : null}

      <SceneToolbar mode={transformMode} onChange={setTransformMode} />

      <Canvas camera={{ position: [8, 6, 10], fov: 45 }} gl={{ alpha: false }}>
        <ViewportScene transformMode={transformMode} />
      </Canvas>

      {isSceneLoading ? (
        <div className='absolute inset-0 flex items-center justify-center bg-[rgba(40,40,40,0.22)] text-sm text-white'>
          Loading models...
        </div>
      ) : null}

      <div className='absolute bottom-6 left-6 grid h-28 w-28 grid-cols-3 grid-rows-3 overflow-hidden border border-[rgba(0,0,0,0.18)] bg-[rgba(255,255,255,0.72)] text-lg font-semibold text-[#7b7b7b]'>
        <div />
        <div className='flex items-center justify-center border-b border-[rgba(0,0,0,0.08)]'>B</div>
        <div />
        <div className='flex items-center justify-center border-r border-[rgba(0,0,0,0.08)]'>L</div>
        <div className='flex items-center justify-center border border-[rgba(0,0,0,0.08)]'>T</div>
        <div className='flex items-center justify-center border-l border-[rgba(0,0,0,0.08)]'>R</div>
        <div />
        <div className='flex items-center justify-center border-t border-[rgba(0,0,0,0.08)]'>F</div>
        <div />
      </div>

      <div className='absolute right-6 bottom-6 z-10 flex flex-col gap-2'>
        {devices.map((device) => (
          <button
            key={device.id}
            className={`min-w-44 border px-3 py-2 text-left text-xs ${
              device.id === selectedDeviceId
                ? 'border-[var(--accent-line)] bg-[rgba(45,136,167,0.18)] text-[#20313a]'
                : 'border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.74)] text-[#444]'
            }`}
            onClick={() => selectDevice(device.id)}
            type='button'
          >
            <div className='font-semibold'>{device.name}</div>
            <div className='mt-1 uppercase tracking-wide opacity-70'>{device.type}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
