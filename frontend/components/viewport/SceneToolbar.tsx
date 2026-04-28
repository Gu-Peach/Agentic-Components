'use client';

type TransformMode = 'translate' | 'rotate' | 'scale';

type SceneToolbarProps = {
  mode: TransformMode;
  onChange: (mode: TransformMode) => void;
};

const items: Array<{ id: TransformMode; label: string }> = [
  { id: 'translate', label: 'Move' },
  { id: 'rotate', label: 'Rotate' },
  { id: 'scale', label: 'Scale' },
];

export function SceneToolbar({ mode, onChange }: SceneToolbarProps) {
  return (
    <div className='absolute left-1/2 top-6 z-10 flex -translate-x-1/2 gap-2 rounded border border-[rgba(0,0,0,0.12)] bg-[rgba(255,255,255,0.72)] px-2 py-2 shadow-sm'>
      {items.map((item) => (
        <button
          key={item.id}
          className={`rounded px-3 py-1 text-xs ${
            item.id === mode
              ? 'bg-[rgba(45,136,167,0.18)] text-[#20313a]'
              : 'text-[#444] hover:bg-[rgba(0,0,0,0.06)]'
          }`}
          onClick={() => onChange(item.id)}
          type='button'
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
