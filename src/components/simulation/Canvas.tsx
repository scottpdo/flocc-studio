'use client';

/**
 * Canvas
 * 
 * Container for the Flocc CanvasRenderer.
 * Provides the mount point for the simulation engine.
 */

import { useRef, useEffect } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';

interface CanvasProps {
  onContainerReady?: (container: HTMLDivElement) => void;
}

export function Canvas({ onContainerReady }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const model = useModelStore((s) => s.model);
  const status = useSimulationStore((s) => s.status);
  const agentCount = useSimulationStore((s) => s.agentCount);

  // Notify parent when container is ready
  useEffect(() => {
    if (containerRef.current && onContainerReady) {
      onContainerReady(containerRef.current);
    }
  }, [onContainerReady]);

  // Show placeholder when no model or no agents
  const showPlaceholder = !model || (status === 'idle' && agentCount === 0);

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden relative">
      {/* Container for CanvasRenderer */}
      <div 
        ref={containerRef} 
        className="flex items-center justify-center"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
      
      {/* Placeholder overlay */}
      {showPlaceholder && model && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            {model.agentTypes.length === 0 ? (
              <p>Add an agent type to get started</p>
            ) : model.populations.length === 0 ? (
              <p>Set agent populations to spawn agents</p>
            ) : (
              <p>Press Play to start the simulation</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
