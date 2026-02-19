'use client';

/**
 * Model View Page
 * 
 * Public view of a model with playable simulation.
 */

import { useEffect, useState, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useModelStore } from '@/stores/model';
import { useSimulation } from '@/lib/flocc/useSimulation';
import { loadModel } from '@/lib/api/models';
import { Canvas } from '@/components/simulation/Canvas';
import { Controls } from '@/components/simulation/Controls';
import { RuntimeParameters } from '@/components/simulation/RuntimeParameters';
import { LineChartList } from '@/components/simulation/LineChartDisplay';
import { AuthButtons } from '@/components/auth/AuthButtons';
import type { StudioModel } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ModelViewPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  
  const setModel = useModelStore((s) => s.setModel);
  const model = useModelStore((s) => s.model);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelData, setModelData] = useState<StudioModel | null>(null);
  
  const loadedIdRef = useRef<string | null>(null);

  // Simulation hook
  const { setContainer, initializeSimulation } = useSimulation();

  // Handle canvas container ready
  const handleContainerReady = useCallback((container: HTMLDivElement) => {
    setContainer(container);
    setTimeout(() => {
      initializeSimulation();
    }, 50);
  }, [setContainer, initializeSimulation]);

  // Load model from database
  useEffect(() => {
    async function load() {
      if (loadedIdRef.current === id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const loaded = await loadModel(id);
      
      if (loaded) {
        setModelData(loaded);
        setModel(loaded);
        loadedIdRef.current = id;
      } else {
        setError('Model not found');
      }
      setLoading(false);
    }

    load();
  }, [id, setModel]);

  // Initialize simulation when model is loaded
  useEffect(() => {
    if (modelData && !loading) {
      const timeout = setTimeout(() => {
        initializeSimulation();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [modelData, loading, initializeSimulation]);

  // Check if current user owns this model
  const isOwner = session?.user?.id && modelData?.userId === session.user.id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !modelData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error ?? 'Model not found'}</div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-white"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-4">
            {isOwner && (
              <Link
                href={`/model/${id}/edit`}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
              >
                Edit Model
              </Link>
            )}
            <AuthButtons />
          </nav>
        </div>
      </header>

      {/* Model Info */}
      <div className="border-b border-gray-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">{modelData.name}</h1>
          {modelData.description && (
            <p className="text-gray-400">{modelData.description}</p>
          )}
        </div>
      </div>

      {/* Simulation Area */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full">
        {/* Main canvas area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-4">
            <Canvas onContainerReady={handleContainerReady} />
          </div>
          <Controls onReset={initializeSimulation} />
        </div>

        {/* Sidebar: Parameters + Visualizations */}
        {(modelData.parameters.length > 0 || (modelData.visualizations?.length ?? 0) > 0) && (
          <aside className="w-80 p-4 border-l border-gray-800 shrink-0 overflow-y-auto">
            {modelData.parameters.length > 0 && (
              <RuntimeParameters />
            )}
            
            {modelData.visualizations && modelData.visualizations.length > 0 && (
              <div className={modelData.parameters.length > 0 ? 'mt-6' : ''}>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Charts</h3>
                <LineChartList visualizations={modelData.visualizations} />
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
