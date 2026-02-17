'use client';

/**
 * Canvas
 * 
 * Container for the Flocc CanvasRenderer.
 * Maintains square aspect ratio via CSS max-width/max-height.
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
    <div className="w-full h-full flex items-center justify-center">
      {/* Square container that scales to fit */}
      <div 
        className="bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center aspect-square"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'min(100%, 100vh - 8rem)', // Account for header and controls
        }}
      >
        {/* Container for CanvasRenderer - canvas will be scaled via CSS */}
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center [&>canvas]:max-w-full [&>canvas]:max-h-full [&>canvas]:w-auto [&>canvas]:h-auto"
        />
        
        {/* Placeholder overlay */}
        {showPlaceholder && model && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400 px-4">
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
    </div>
  );
}
