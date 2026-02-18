'use client';

/**
 * EditorLayout
 * 
 * Main editor shell with sliding panel and canvas.
 * Layout: LEFT sidebar (Agent Types + Properties panel) | RIGHT (Canvas)
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useModelStore, useCanUndo, useCanRedo, useModelUndo, useModelRedo } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import { useSimulation } from '@/lib/flocc/useSimulation';
import { saveModel } from '@/lib/api/models';
import { AgentPanel } from './AgentPanel';
import { PropertyPanel } from './PropertyPanel';
import { Canvas } from '@/components/simulation/Canvas';
import { Controls } from '@/components/simulation/Controls';

interface EditorLayoutProps {
  modelId: string;
}

export function EditorLayout({ modelId }: EditorLayoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  
  const model = useModelStore((s) => s.model);
  const isDirty = useModelStore((s) => s.isDirty);
  const markClean = useModelStore((s) => s.markClean);
  const updateName = useModelStore((s) => s.updateName);
  const setModel = useModelStore((s) => s.setModel);

  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const undo = useModelUndo();
  const redo = useModelRedo();
  
  const captureThumbnail = useSimulationStore((s) => s.captureThumbnail);

  // Selection state - controls whether properties panel is shown
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track if this is a new model (not yet saved to DB)
  const isNewModel = modelId === 'new';

  // Simulation hook
  const { setContainer, initializeSimulation } = useSimulation();

  // Handle canvas container ready
  const handleContainerReady = useCallback((container: HTMLDivElement) => {
    setContainer(container);
    setTimeout(() => {
      initializeSimulation();
    }, 50);
  }, [setContainer, initializeSimulation]);

  // Re-initialize simulation when model changes significantly
  useEffect(() => {
    const timeout = setTimeout(() => {
      initializeSimulation();
    }, 500);
    return () => clearTimeout(timeout);
  }, [
    model?.agentTypes,
    model?.populations,
    model?.environment,
    initializeSimulation,
  ]);

  // Close properties panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedAgentId) {
        setSelectedAgentId(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAgentId]);

  // Close properties panel function
  const closePropertiesPanel = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!model || !session?.user) {
      setSaveError('Please sign in to save');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    // Capture thumbnail before saving
    const thumbnailUrl = captureThumbnail(400);
    const modelWithThumbnail = thumbnailUrl 
      ? { ...model, thumbnailUrl } 
      : model;

    const result = await saveModel(modelWithThumbnail, isNewModel);

    setIsSaving(false);

    if (result.success && result.model) {
      setModel(result.model);
      markClean();
      
      // If it was a new model, redirect to the saved model's edit page
      if (isNewModel) {
        router.replace(`/model/${result.model.id}/edit`);
      }
    } else {
      setSaveError(result.error ?? 'Failed to save');
    }
  }, [model, session, isNewModel, setModel, markClean, router, captureThumbnail]);

  if (!model) return null;

  const propertiesPanelOpen = selectedAgentId !== null;

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

        {/* Save error message */}
        {saveError && (
          <span className="text-red-400 text-sm">{saveError}</span>
        )}

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
        <button 
          onClick={handleSave}
          disabled={isSaving || !session?.user}
          className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          title={!session?.user ? 'Sign in to save' : undefined}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
        {!isNewModel && (
          <Link
            href={`/model/${modelId}`}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm"
          >
            View
          </Link>
        )}
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Agent Types + Properties Panel */}
        <aside className="flex shrink-0 border-r border-gray-800">
          {/* Agent Types Panel - Always visible */}
          <div className="w-64 bg-gray-900 overflow-hidden">
            <AgentPanel
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
            />
          </div>

          {/* Properties Panel - Slides out when agent selected */}
          <div
            className={`bg-gray-900 border-l border-gray-800 overflow-hidden transition-all duration-200 ease-in-out ${
              propertiesPanelOpen ? 'w-80' : 'w-0'
            }`}
          >
            <div className="w-80 h-full flex flex-col">
              {/* Close button header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <span className="text-sm font-medium text-gray-400">Properties</span>
                <button
                  onClick={closePropertiesPanel}
                  className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition"
                  title="Close (Esc)"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Properties content */}
              <div className="flex-1 overflow-y-auto">
                <PropertyPanel selectedAgentId={selectedAgentId} />
              </div>
            </div>
          </div>
        </aside>

        {/* Right - Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4">
            <Canvas onContainerReady={handleContainerReady} />
          </div>
          <Controls onReset={initializeSimulation} />
        </main>
      </div>
    </div>
  );
}
