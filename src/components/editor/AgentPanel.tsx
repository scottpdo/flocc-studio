'use client';

/**
 * AgentPanel
 * 
 * Left sidebar for managing agent types and populations.
 */

import { useState, useRef, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import type { AgentType, Population } from '@/types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

interface AgentPanelProps {
  selectedAgentId: string | null;
  onSelectAgent: (id: string | null) => void;
}

export function AgentPanel({ selectedAgentId, onSelectAgent }: AgentPanelProps) {
  const model = useModelStore((s) => s.model);
  const addAgentType = useModelStore((s) => s.addAgentType);
  const updateAgentType = useModelStore((s) => s.updateAgentType);
  const removeAgentType = useModelStore((s) => s.removeAgentType);
  const addPopulation = useModelStore((s) => s.addPopulation);
  const updatePopulation = useModelStore((s) => s.updatePopulation);
  const removePopulation = useModelStore((s) => s.removePopulation);

  // Track which agent name is being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!model) return null;

  const handleAddAgentType = () => {
    const id = nanoid();
    const newAgent: AgentType = {
      id,
      name: `Agent ${model.agentTypes.length + 1}`,
      color: COLORS[model.agentTypes.length % COLORS.length],
      shape: 'circle',
      size: 10,
      properties: [],
      behaviors: [],
    };
    addAgentType(newAgent);

    // Auto-create a population for the new type
    const popId = nanoid();
    const newPop: Population = {
      id: popId,
      agentTypeId: id,
      count: 20,
      distribution: 'random',
    };
    addPopulation(newPop);

    onSelectAgent(id);
    // Start editing the name immediately
    setEditingId(id);
  };

  // Get population for an agent type
  const getPopulation = (agentTypeId: string): Population | undefined => {
    return model.populations.find((p) => p.agentTypeId === agentTypeId);
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Agent Types</h2>
        <button
          onClick={handleAddAgentType}
          className="text-sm px-2 py-1 rounded bg-blue-600 hover:bg-blue-500"
        >
          + Add
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {model.agentTypes.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No agent types yet. Click &quot;Add&quot; to create one.
          </p>
        ) : (
          model.agentTypes.map((agent) => {
            const pop = getPopulation(agent.id);
            const isSelected = selectedAgentId === agent.id;
            const isEditing = editingId === agent.id;

            return (
              <div
                key={agent.id}
                className="flex items-center"
              >
                <div
                  onClick={() => onSelectAgent(isSelected ? null : agent.id)}
                  className={`flex-1 p-3 rounded-lg cursor-pointer transition group ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-gray-800 hover:bg-gray-750 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color/shape indicator */}
                    <ShapeIndicator shape={agent.shape} color={agent.color} />

                    <div className="flex-1 min-w-0">
                      {/* Inline editable name */}
                      <InlineEditableName
                        value={agent.name}
                        isEditing={isEditing}
                        onStartEdit={() => setEditingId(agent.id)}
                        onEndEdit={() => setEditingId(null)}
                        onChange={(name) => updateAgentType(agent.id, { name })}
                      />
                      <div className="text-xs text-gray-500">
                        {pop?.count ?? 0} agents · {agent.behaviors.length} behavior
                        {agent.behaviors.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (pop) removePopulation(pop.id);
                        removeAgentType(agent.id);
                        if (isSelected) onSelectAgent(null);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                    >
                      ×
                    </button>
                  </div>

                  {/* Quick population edit */}
                  {isSelected && pop && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <label className="flex items-center gap-2 text-sm">
                        <span className="text-gray-400">Count:</span>
                        <input
                          type="number"
                          value={pop.count}
                          onChange={(e) =>
                            updatePopulation(pop.id, { count: parseInt(e.target.value) || 0 })
                          }
                          min={0}
                          max={1000}
                          className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Selection arrow indicator */}
                <div 
                  className={`w-4 flex items-center justify-center transition-opacity ${
                    isSelected ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <svg 
                    className="w-3 h-3 text-blue-500" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 4l8 8-8 8z" />
                  </svg>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ShapeIndicator
// ============================================================================

interface ShapeIndicatorProps {
  shape: string;
  color: string;
}

function ShapeIndicator({ shape, color }: ShapeIndicatorProps) {
  return (
    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
      {shape === 'circle' && (
        <div
          className="w-5 h-5 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {shape === 'square' && (
        <div
          className="w-5 h-5"
          style={{ backgroundColor: color }}
        />
      )}
      {shape === 'triangle' && (
        <div
          className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[16px]"
          style={{ borderBottomColor: color }}
        />
      )}
      {shape === 'arrow' && (
        <svg 
          className="w-5 h-5" 
          viewBox="0 0 20 20" 
          fill={color}
        >
          <path d="M10 2 L18 18 L10 14 L2 18 Z" />
        </svg>
      )}
    </div>
  );
}

// ============================================================================
// InlineEditableName
// ============================================================================

interface InlineEditableNameProps {
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onChange: (value: string) => void;
}

function InlineEditableName({ value, isEditing, onStartEdit, onEndEdit, onChange }: InlineEditableNameProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onEndEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === 'Escape') {
            onEndEdit();
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="font-medium bg-gray-700 border border-blue-500 rounded px-1 -ml-1 w-full focus:outline-none"
      />
    );
  }

  return (
    <div
      className="font-medium truncate hover:text-blue-400 cursor-text"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onStartEdit();
      }}
      title="Double-click to edit"
    >
      {value}
    </div>
  );
}
