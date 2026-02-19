'use client';

/**
 * LineChartDisplay
 * 
 * Displays a LineChartRenderer canvas from the simulation engine.
 * Used in both the editor preview and view page.
 */

import { useEffect, useRef } from 'react';
import { useSimulationStore } from '@/stores/simulation';
import type { Visualization } from '@/types';

interface LineChartDisplayProps {
  visualization: Visualization;
  className?: string;
}

export function LineChartDisplay({ visualization, className = '' }: LineChartDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engine = useSimulationStore((s) => s.engine);
  const tick = useSimulationStore((s) => s.tick);

  useEffect(() => {
    if (!containerRef.current || !engine) return;

    const chartCanvas = engine.getChartCanvas(visualization.id);
    if (!chartCanvas) return;

    // Clear container and append canvas
    containerRef.current.innerHTML = '';
    
    // Clone the canvas for display (the original is owned by the renderer)
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = chartCanvas.width;
    displayCanvas.height = chartCanvas.height;
    displayCanvas.style.width = '100%';
    displayCanvas.style.height = 'auto';
    displayCanvas.style.display = 'block';
    
    const ctx = displayCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(chartCanvas, 0, 0);
    }
    
    containerRef.current.appendChild(displayCanvas);
  }, [engine, visualization.id, tick]); // Re-render on tick changes

  if (!visualization.enabled) {
    return null;
  }

  return (
    <div className={`bg-white rounded overflow-hidden ${className}`}>
      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700">{visualization.name}</h4>
        {visualization.series.length > 0 && (
          <div className="flex gap-3 mt-1">
            {visualization.series.map((series) => (
              <div key={series.id} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: series.color }}
                />
                <span className="text-xs text-gray-600">{series.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div ref={containerRef} className="p-2" />
    </div>
  );
}

/**
 * LineChartList
 * 
 * Displays all enabled visualizations from the model.
 */

interface LineChartListProps {
  visualizations: Visualization[];
  className?: string;
}

export function LineChartList({ visualizations, className = '' }: LineChartListProps) {
  const enabledVisualizations = visualizations.filter((v) => v.enabled);

  if (enabledVisualizations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {enabledVisualizations.map((viz) => (
        <LineChartDisplay key={viz.id} visualization={viz} />
      ))}
    </div>
  );
}
