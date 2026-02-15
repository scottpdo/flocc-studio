'use client';

import Link from 'next/link';
import { useModelStore, useCanUndo, useCanRedo, useModelUndo, useModelRedo } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import { useUI } from '@/contexts/UIContext';
import { AgentPanel } from './AgentPanel';
import { Canvas } from '@/components/simulation/Canvas';
import { Controls } from '@/components/simulation/Controls';

interface EditorLayoutProps {
  modelId: string;
}

export function EditorLayout({ modelId }: EditorLayoutProps) {
  const model = useModelStore((s) => s.model);
  const isDirty = useModelStore((s) => s.isDirty);
  const updateName = useModelStore((s) => s.updateName);
  
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useModelUndo();
  const redo = useModelRedo();

  const { leftPanelOpen, rightPanelOpen, toggleLeftPanel, toggleRightPanel } = useUI();

  if (!model) return null;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
        <Link href="/" className="font-bold text-lg">
          Flocc
        </Link>
        
        <div className="h-6 w-px bg-gray-700" />
        
        {/* Model Name */}
        <input
          type="text"
          value={model.name}
          onChange={(e) => updateName(e.target.value)}
          className="bg-transparent border-none text-lg font-medium focus:outline-none focus:bg-gray-800 px-2 py-1 rounded"
        />
        {isDirty && <span className="text-gray-500 text-sm">•</span>}

        <div className="flex-1" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => undo()}
            disabled={!canUndo}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            ↶
          </button>
          <button
            onClick={() => redo()}
            disabled={!canRedo}
            className="p-2 rounded hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            ↷
          </button>
        </div>

        <div className="h-6 w-px bg-gray-700" />

        {/* Actions */}
        <button className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-sm">
          Save
        </button>
        <Link
          href={`/model/${modelId}`}
          className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm"
        >
          View
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Agent Types */}
        <aside
          className={`${
            leftPanelOpen ? 'w-72' : 'w-0'
          } border-r border-gray-800 bg-gray-900 transition-all overflow-hidden shrink-0`}
        >
          <AgentPanel />
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <Canvas />
          </div>
          <Controls />
        </main>

        {/* Right Panel - Properties */}
        <aside
          className={`${
            rightPanelOpen ? 'w-72' : 'w-0'
          } border-l border-gray-800 bg-gray-900 transition-all overflow-hidden shrink-0`}
        >
          <div className="p-4">
            <h2 className="font-semibold mb-4">Properties</h2>
            <p className="text-gray-500 text-sm">Select an agent type or behavior to edit its properties</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
