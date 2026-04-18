'use client';

import { useSceneStore } from '@/stores/sceneStore';

const sceneBadges = ['焊接单元', '双机器人', 'Mock 渲染'];

export function Viewport3D() {
  const { devices, selectedDeviceId, selectDevice } = useSceneStore();

  return (
    <section className='relative h-full overflow-hidden bg-[#d5d2cb]'>
      <div className='absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:60px_60px] opacity-60' />
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_48%,rgba(0,0,0,0.08)_100%)]' />
      <div className='absolute left-6 top-6 flex gap-2'>
        {sceneBadges.map((badge) => (
          <span
            key={badge}
            className='border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.65)] px-2 py-1 text-xs text-[#444]'
          >
            {badge}
          </span>
        ))}
      </div>

      <div className='absolute inset-x-[12%] top-[14%] bottom-[10%] border border-[rgba(0,0,0,0.12)] bg-[linear-gradient(180deg,#6f6f6f,#555)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'>
        <div className='absolute inset-x-0 bottom-0 h-3 bg-[repeating-linear-gradient(90deg,#eab308_0_40px,#1b1b1b_40px_80px)]' />
        <div className='absolute left-[16%] top-[34%] h-28 w-20 bg-[#5a5a5a] shadow-lg' />
        <button
          className='absolute left-[30%] top-[18%] h-40 w-10 origin-bottom -rotate-12 bg-[#a8efff] shadow-[0_0_0_3px_rgba(123,192,242,0.45)]'
          onClick={() => selectDevice('robot-left')}
          type='button'
        />
        <button
          className='absolute right-[25%] top-[18%] h-40 w-10 origin-bottom rotate-12 bg-[#ffffff] shadow-[0_0_0_3px_rgba(123,192,242,0.45)]'
          onClick={() => selectDevice('robot-right')}
          type='button'
        />
        <button
          className='absolute bottom-[12%] left-[24%] h-8 w-[50%] bg-[#979797]'
          onClick={() => selectDevice('conveyor-01')}
          type='button'
        />
        <button
          className='absolute left-[48%] top-[26%] h-32 w-16 bg-[#d8af1d]'
          onClick={() => selectDevice('lift-01')}
          type='button'
        />
      </div>

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

      <div className='absolute right-6 bottom-6 flex flex-col gap-2'>
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
