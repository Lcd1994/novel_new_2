import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface ThreeColumnLayoutProps {
  leftPanel?: ReactNode;
  centerPanel: ReactNode;
  rightPanel?: ReactNode;
  leftWidth?: string;
  rightWidth?: string;
}

export default function ThreeColumnLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  leftWidth = 'w-72',
  rightWidth = 'w-80',
}: ThreeColumnLayoutProps) {
  return (
    <div className="flex h-screen">
      {leftPanel && (
        <aside className={`${leftWidth} h-screen bg-ink-600/30 border-r border-ink-500/30 flex flex-col`}>
          {leftPanel}
        </aside>
      )}

      <main className="flex-1 h-screen overflow-hidden">
        {centerPanel}
      </main>

      {rightPanel && (
        <aside className={`${rightWidth} h-screen bg-ink-600/30 border-l border-ink-500/30 flex flex-col`}>
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
