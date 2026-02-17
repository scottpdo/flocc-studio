'use client';

/**
 * PropertyBuilder
 * 
 * UI for adding and configuring custom properties on an agent type.
 */

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import type { AgentType, PropertyDef } from '@/types';

interface PropertyBuilderProps {
  agentType: AgentType;
}

export function PropertyBuilder({ agentType }: PropertyBuilderProps) {
  const updateAgentType = useModelStore((s) => s.updateAgentType);
  const [isAdding, setIsAdding] = useState(false);
  const [newPropName, setNewPropName] = useState('');

  const addProperty = () => {
    if (!newPropName.trim()) return;
    
    const newProp: PropertyDef = {
      id: nanoid(),
      name: newPropName.trim(),
      type: 'number',
      defaultValue: 0,
    };
    
    updateAgentType(agentType.id, {
      properties: [...agentType.properties, newProp],
    });
    
    setNewPropName('');
    setIsAdding(false);
  };

  const updateProperty = (propId: string, changes: Partial<PropertyDef>) => {
    updateAgentType(agentType.id, {
      properties: agentType.properties.map((p) =>
        p.id === propId ? { ...p, ...changes } : p
      ),
    });
  };

  const removeProperty = (propId: string) => {
    updateAgentType(agentType.id, {
      properties: agentType.properties.filter((p) => p.id !== propId),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">Properties</h3>
      </div>

      {/* Property list */}
      <div className="space-y-2">
        {agentType.properties.length === 0 && !isAdding ? (
          <p className="text-xs text-gray-500">No custom properties</p>
        ) : (
          agentType.properties.map((prop) => (
            <PropertyCard
              key={prop.id}
              property={prop}
              onUpdate={(changes) => updateProperty(prop.id, changes)}
              onRemove={() => removeProperty(prop.id)}
            />
          ))
        )}
      </div>

      {/* Add property form */}
      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newPropName}
            onChange={(e) => setNewPropName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addProperty();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewPropName('');
              }
            }}
            placeholder="Property name..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={addProperty}
            disabled={!newPropName.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm transition"
          >
            Add
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewPropName('');
            }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm hover:bg-gray-600 transition text-left"
        >
          + Add Property
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PropertyCard
// ============================================================================

interface PropertyCardProps {
  property: PropertyDef;
  onUpdate: (changes: Partial<PropertyDef>) => void;
  onRemove: () => void;
}

function PropertyCard({ property, onUpdate, onRemove }: PropertyCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 group">
      <div className="flex items-center justify-between mb-2">
        <input
          type="text"
          value={property.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="text-sm font-medium bg-transparent border-none focus:outline-none focus:bg-gray-700 px-1 -ml-1 rounded"
        />
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition text-sm"
        >
          ×
        </button>
      </div>

      <div className="space-y-2">
        {/* Type */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 w-16">Type</label>
          <select
            value={property.type}
            onChange={(e) => onUpdate({ 
              type: e.target.value as 'number' | 'boolean',
              defaultValue: e.target.value === 'number' ? 0 : false,
            })}
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </div>

        {/* Default value */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400 w-16">Default</label>
          {property.type === 'number' ? (
            <input
              type="number"
              value={property.defaultValue ?? 0}
              onChange={(e) => onUpdate({ defaultValue: parseFloat(e.target.value) || 0 })}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            />
          ) : (
            <input
              type="checkbox"
              checked={property.defaultValue ?? false}
              onChange={(e) => onUpdate({ defaultValue: e.target.checked })}
              className="rounded bg-gray-700 border-gray-600"
            />
          )}
        </div>

        {/* Min/Max for numbers */}
        {property.type === 'number' && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Range</label>
            <input
              type="number"
              value={property.min ?? ''}
              onChange={(e) => onUpdate({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Min"
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="text-gray-500">–</span>
            <input
              type="number"
              value={property.max ?? ''}
              onChange={(e) => onUpdate({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
              placeholder="Max"
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
