'use client';

/**
 * Canvas
 * 
 * Container for the Flocc CanvasRenderer.
 * Maintains square aspect ratio and centers within available space.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';

interface CanvasProps {
  onContainerReady?: (container: HTMLDivElement) => void;
}

export function Canvas({ onContainerReady }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(500);
  
  const model = useModelStore((s) => s.model);
  const status = useSimulationStore((s) => s.status);
  const agentCount = useSimulationStore((s) => s.agentCount);

  // Calculate square size based on container dimensions
  const updateCanvasSize = useCallback(() => {
    if (!wrapperRef.current) return;
    
    const rect = wrapperRef.current.getBoundingClientRect();
    // Use the smaller dimension to ensure square fits, with some padding
    const padding = 32; // 16px on each side
    const maxSize = Math.min(rect.width - padding, rect.height - padding);
    const size = Math.max(200, Math.floor(maxSize)); // Minimum 200px
    
    setCanvasSize(size);
  }, []);

  // Update size on mount and resize
  useEffect(() => {
    updateCanvasSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [updateCanvasSize]);

  // Notify parent when container is ready
  useEffect(() => {
    if (containerRef.current && onContainerReady) {
      onContainerReady(containerRef.current);
    }
  }, [onContainerReady]);

  // Show placeholder when no model or no agents
  const showPlaceholder = !model || (status === 'idle' && agentCount === 0);

  return (
    <div 
      ref={wrapperRef}
      className="w-full h-full flex items-center justify-center"
    >
      <div 
        className="bg-gray-900 rounded-lg overflow-hidden relative flex items-center justify-center"
        style={{
          width: canvasSize,
          height: canvasSize,
        }}
      >
        {/* Container for CanvasRenderer */}
        <div 
          ref={containerRef} 
          className="flex items-center justify-center"
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
