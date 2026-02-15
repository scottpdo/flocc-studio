'use client';

import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import type { AgentType } from '@/types';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

export function AgentPanel() {
  const model = useModelStore((s) => s.model);
  const addAgentType = useModelStore((s) => s.addAgentType);
  const removeAgentType = useModelStore((s) => s.removeAgentType);

  if (!model) return null;

  const handleAddAgentType = () => {
    const newAgent: AgentType = {
      id: nanoid(),
      name: `Agent ${model.agentTypes.length + 1}`,
      color: COLORS[model.agentTypes.length % COLORS.length],
      shape: 'circle',
      size: 10,
      properties: [],
      behaviors: [],
    };
    addAgentType(newAgent);
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
          model.agentTypes.map((agent) => (
            <div
              key={agent.id}
              className="p-3 rounded-lg bg-gray-800 hover:bg-gray-750 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{agent.name}</div>
                  <div className="text-xs text-gray-500">
                    {agent.behaviors.length} behavior{agent.behaviors.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeAgentType(agent.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Populations Section */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <h3 className="font-semibold mb-2 text-sm text-gray-400">Populations</h3>
        <p className="text-gray-500 text-xs">
          Define how many agents of each type to create
        </p>
      </div>
    </div>
  );
}
