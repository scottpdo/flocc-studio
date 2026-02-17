'use client';

/**
 * PropertyPanel
 * 
 * Sliding panel for editing the selected agent type's properties and behaviors.
 */

import { useModelStore } from '@/stores/model';
import { BehaviorBuilder } from './BehaviorBuilder';
import { PropertyBuilder } from './PropertyBuilder';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'];
const SHAPES = [
  { value: 'circle', label: '●', title: 'Circle' },
  { value: 'square', label: '■', title: 'Square' },
  { value: 'triangle', label: '▲', title: 'Triangle' },
  { value: 'arrow', label: '➤', title: 'Arrow (direction-aware)' },
] as const;

interface PropertyPanelProps {
  selectedAgentId: string | null;
}

export function PropertyPanel({ selectedAgentId }: PropertyPanelProps) {
  const model = useModelStore((s) => s.model);
  const updateAgentType = useModelStore((s) => s.updateAgentType);

  if (!model || !selectedAgentId) {
    return null;
  }

  const agentType = model.agentTypes.find((t) => t.id === selectedAgentId);
  if (!agentType) return null;

  return (
    <div className="p-4 h-full overflow-y-auto">
      {/* Color */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-2">Color</label>
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
        <label className="block text-sm text-gray-400 mb-2">Shape</label>
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
              title={shape.title}
            >
              {shape.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Size: {agentType.size}px</label>
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

      {/* Custom Properties */}
      <PropertyBuilder agentType={agentType} />

      {/* Divider */}
      <div className="border-t border-gray-700 my-4" />

      {/* Behaviors */}
      <BehaviorBuilder agentType={agentType} />
    </div>
  );
}
