'use client';

import { Group, Panel, Separator } from 'react-resizable-panels';
import { AIChatPanel } from '@/components/ai-chat/AIChatPanel';
import { ECatalogPanel } from '@/components/ecatalog/ECatalogPanel';
import { TopBar } from '@/components/layout/TopBar';
import { SimulationBar } from '@/components/layout/SimulationBar';
import { PropertiesPanel } from '@/components/properties/PropertiesPanel';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { Viewport3D } from '@/components/viewport/Viewport3D';

type WorkspaceLayoutProps = {
  projectId: string;
};

function ResizeHandle() {
  return (
    <Separator className='relative bg-[var(--border-soft)] transition hover:bg-[var(--accent-line)] data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:cursor-row-resize data-[orientation=vertical]:w-1 data-[orientation=vertical]:cursor-col-resize' />
  );
}

export function WorkspaceLayout({ projectId }: WorkspaceLayoutProps) {
  return (
    <main className='flex h-screen flex-col overflow-hidden bg-[var(--bg-canvas)]'>
      <TopBar projectId={projectId} />
      <section className='flex-1 overflow-hidden p-px'>
        <div className='flex h-full overflow-hidden border border-[var(--border-soft)] bg-[var(--bg-shell)] shadow-[var(--shadow-panel)]'>
          <Group>
            <Panel defaultSize={26} minSize={18}>
              <ECatalogPanel />
            </Panel>
            <ResizeHandle />
            <Panel defaultSize={48} minSize={28}>
              <Group orientation='vertical'>
                <Panel defaultSize={74} minSize={46}>
                  <div className='relative h-full'>
                    <SimulationBar />
                    <Viewport3D />
                  </div>
                </Panel>
                <ResizeHandle />
                <Panel defaultSize={26} minSize={14}>
                  <TerminalPanel />
                </Panel>
              </Group>
            </Panel>
            <ResizeHandle />
            <Panel defaultSize={26} minSize={20}>
              <Group orientation='vertical'>
                <Panel defaultSize={62} minSize={34}>
                  <PropertiesPanel />
                </Panel>
                <ResizeHandle />
                <Panel defaultSize={38} minSize={20}>
                  <AIChatPanel />
                </Panel>
              </Group>
            </Panel>
          </Group>
        </div>
      </section>
    </main>
  );
}
