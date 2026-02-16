'use client';

/**
 * PropertyPanel
 * 
 * Right sidebar for editing the selected agent type's properties and behaviors.
 */

import { useModelStore } from '@/stores/model';
import { BehaviorBuilder } from './BehaviorBuilder';
import type { AgentType } from '@/types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
const SHAPES = [
  { value: 'circle', label: '●' },
  { value: 'square', label: '■' },
  { value: 'triangle', label: '▲' },
] as const;

interface PropertyPanelProps {
  selectedAgentId: string | null;
}

export function PropertyPanel({ selectedAgentId }: PropertyPanelProps) {
  const model = useModelStore((s) => s.model);
  const updateAgentType = useModelStore((s) => s.updateAgentType);

  if (!model || !selectedAgentId) {
    return (
      <div className="p-4">
        <h2 className="font-semibold mb-4">Properties</h2>
        <p className="text-gray-500 text-sm">
          Select an agent type to edit its properties and behaviors
        </p>
      </div>
    );
  }

  const agentType = model.agentTypes.find((t) => t.id === selectedAgentId);
  if (!agentType) return null;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="font-semibold mb-4">{agentType.name}</h2>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Name</label>
        <input
          type="text"
          value={agentType.name}
          onChange={(e) => updateAgentType(agentType.id, { name: e.target.value })}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Color */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Color</label>
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => updateAgentType(agentType.id, { color })}
              className={`w-8 h-8 rounded-full border-2 transition ${
                agentType.color === color ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Shape */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Shape</label>
        <div className="flex gap-2">
          {SHAPES.map((shape) => (
            <button
              key={shape.value}
              onClick={() => updateAgentType(agentType.id, { shape: shape.value })}
              className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xl transition ${
                agentType.shape === shape.value
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 bg-gray-800 hover:bg-gray-700'
              }`}
              style={{ color: agentType.color }}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-1">Size: {agentType.size}px</label>
        <input
          type="range"
          value={agentType.size}
          onChange={(e) => updateAgentType(agentType.id, { size: parseInt(e.target.value) })}
          min={4}
          max={40}
          step={1}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-4" />

      {/* Behaviors */}
      <BehaviorBuilder agentType={agentType} />
    </div>
  );
}
