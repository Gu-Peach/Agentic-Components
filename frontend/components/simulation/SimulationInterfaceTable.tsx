'use client';

type InterfaceRow = { label: string; value: string; interfaceName: string };

export function SimulationInterfaceTable({
  activeInterfaceName,
  onRowClick,
  rows,
}: {
  activeInterfaceName: string | null;
  onRowClick: (interfaceName: string) => void;
  rows: readonly InterfaceRow[];
}) {
  return (
    <div className='space-y-px border border-[var(--border-strong)] bg-[var(--border-strong)]'>
      {rows.map((row) => (
        <button
          key={row.interfaceName}
          className={`grid w-full grid-cols-[120px_1fr] items-center text-left text-sm transition ${
            activeInterfaceName === row.interfaceName
              ? 'bg-[rgba(77,163,255,0.16)]'
              : 'bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-hover)]'
          }`}
          onClick={() => onRowClick(row.interfaceName)}
          type='button'
        >
          <div className='px-3 py-2 text-[var(--text-secondary)]'>{row.label}</div>
          <div className='border-l border-[var(--border-strong)] bg-[var(--bg-input)] px-2 py-1.5 text-[var(--text-dark)]'>
            {row.value}
          </div>
        </button>
      ))}
    </div>
  );
}
