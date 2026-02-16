'use client';

/**
 * BehaviorBuilder
 * 
 * UI for adding and configuring behaviors on an agent type.
 */

import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import { BEHAVIOR_LIBRARY, getBehaviorDef, createBehavior } from '@/lib/flocc/behaviors';
import type { AgentType, Behavior, BehaviorType } from '@/types';

interface BehaviorBuilderProps {
  agentType: AgentType;
}

export function BehaviorBuilder({ agentType }: BehaviorBuilderProps) {
  const model = useModelStore((s) => s.model);
  const addBehavior = useModelStore((s) => s.addBehavior);
  const updateBehavior = useModelStore((s) => s.updateBehavior);
  const removeBehavior = useModelStore((s) => s.removeBehavior);

  const handleAddBehavior = (type: BehaviorType) => {
    const behavior = createBehavior(type, nanoid());
    addBehavior(agentType.id, behavior);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Behaviors</h3>
      </div>

      {/* Behavior list */}
      <div className="space-y-2">
        {agentType.behaviors.length === 0 ? (
          <p className="text-xs text-gray-500">No behaviors yet</p>
        ) : (
          agentType.behaviors.map((behavior, index) => (
            <BehaviorCard
              key={behavior.id}
              behavior={behavior}
              agentType={agentType}
              allAgentTypes={model?.agentTypes ?? []}
              onUpdate={(changes) => updateBehavior(agentType.id, behavior.id, changes)}
              onRemove={() => removeBehavior(agentType.id, behavior.id)}
            />
          ))
        )}
      </div>

      {/* Add behavior dropdown - grouped by category */}
      <div className="relative">
        <select
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleAddBehavior(e.target.value as BehaviorType);
            }
          }}
        >
          <option value="">+ Add Behavior</option>
          <optgroup label="Movement">
            {BEHAVIOR_LIBRARY.filter(d => d.category === 'movement').map((def) => (
              <option key={def.type} value={def.type}>
                {def.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Lifecycle">
            {BEHAVIOR_LIBRARY.filter(d => d.category === 'lifecycle').map((def) => (
              <option key={def.type} value={def.type}>
                {def.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
}

// ============================================================================
// BehaviorCard
// ============================================================================

interface BehaviorCardProps {
  behavior: Behavior;
  agentType: AgentType;
  allAgentTypes: AgentType[];
  onUpdate: (changes: Partial<Behavior>) => void;
  onRemove: () => void;
}

function BehaviorCard({ behavior, agentType, allAgentTypes, onUpdate, onRemove }: BehaviorCardProps) {
  const def = getBehaviorDef(behavior.type);
  if (!def) return null;

  const updateParam = (key: string, value: any) => {
    onUpdate({
      params: { ...behavior.params, [key]: value },
    });
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={behavior.enabled}
            onChange={(e) => onUpdate({ enabled: e.target.checked })}
            className="rounded bg-gray-700 border-gray-600"
          />
          <span className="text-sm font-medium">{def.name}</span>
        </div>
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition text-sm"
        >
          ×
        </button>
      </div>

      {/* Parameters */}
      <div className="space-y-2 pl-6">
        {def.params.map((param) => (
          <div key={param.key} className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">{param.name}</label>
            {param.type === 'number' && (
              <input
                type="number"
                value={behavior.params[param.key] ?? param.default}
                onChange={(e) => updateParam(param.key, parseFloat(e.target.value))}
                min={param.min}
                max={param.max}
                step={param.step}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
            )}
            {param.type === 'agentType' && (
              <select
                value={behavior.params[param.key] ?? ''}
                onChange={(e) => updateParam(param.key, e.target.value || null)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select type...</option>
                {allAgentTypes.map((at) => (
                  <option key={at.id} value={at.id}>
                    {at.name}
                  </option>
                ))}
              </select>
            )}
            {param.type === 'boolean' && (
              <input
                type="checkbox"
                checked={behavior.params[param.key] ?? param.default}
                onChange={(e) => updateParam(param.key, e.target.checked)}
                className="rounded bg-gray-700 border-gray-600"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
