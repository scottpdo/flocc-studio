'use client';

/**
 * VisualizationsAccordion
 * 
 * Accordion section for managing visualizations (line charts).
 * Allows adding, selecting, and removing visualizations.
 */

import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import { Accordion } from '@/components/ui/Accordion';
import type { Visualization } from '@/types';

interface VisualizationsAccordionProps {
  selectedVisualizationId: string | null;
  onSelectVisualization: (id: string | null) => void;
}

export function VisualizationsAccordion({
  selectedVisualizationId,
  onSelectVisualization,
}: VisualizationsAccordionProps) {
  const model = useModelStore((s) => s.model);
  const addVisualization = useModelStore((s) => s.addVisualization);
  const removeVisualization = useModelStore((s) => s.removeVisualization);

  if (!model) return null;

  const visualizations = model.visualizations ?? [];
  const agentTypes = model.agentTypes;

  const handleAddVisualization = () => {
    // Create a default line chart with one series per agent type (count)
    const defaultSeries = agentTypes.map((at, i) => ({
      id: nanoid(),
      name: at.name,
      color: at.color,
      metric: {
        type: 'count' as const,
        agentTypeId: at.id,
      },
    }));

    const newViz: Visualization = {
      id: nanoid(),
      name: `Chart ${visualizations.length + 1}`,
      type: 'line-chart',
      enabled: true,
      series: defaultSeries,
      options: {
        autoScale: true,
        autoScroll: false,
      },
    };

    addVisualization(newViz);
    onSelectVisualization(newViz.id);
  };

  const handleRemoveVisualization = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeVisualization(id);
    if (selectedVisualizationId === id) {
      onSelectVisualization(null);
    }
  };

  return (
    <Accordion
      title="Visualizations"
      defaultOpen={true}
      badge={visualizations.length}
      action={
        <button
          onClick={handleAddVisualization}
          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded"
          title="Add visualization"
        >
          + Add
        </button>
      }
    >
      {visualizations.length === 0 ? (
        <p className="text-gray-500 text-sm py-2">No visualizations yet</p>
      ) : (
        <ul className="space-y-1">
          {visualizations.map((viz) => (
            <li
              key={viz.id}
              onClick={() => onSelectVisualization(viz.id)}
              className={`
                flex items-center justify-between p-2 rounded cursor-pointer
                ${selectedVisualizationId === viz.id 
                  ? 'bg-blue-600/30 border border-blue-500' 
                  : 'hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <span className="text-sm">{viz.name}</span>
                {!viz.enabled && (
                  <span className="text-xs text-gray-500">(disabled)</span>
                )}
              </div>
              <button
                onClick={(e) => handleRemoveVisualization(e, viz.id)}
                className="text-gray-500 hover:text-red-400 text-xs px-1"
                title="Remove visualization"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Accordion>
  );
}
