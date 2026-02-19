'use client';

/**
 * ParametersAccordion
 * 
 * Accordion section for managing model-level parameters.
 * These are global values that can be adjusted at runtime via sliders.
 */

import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useModelStore } from '@/stores/model';
import { Accordion } from '@/components/ui/Accordion';
import type { Parameter } from '@/types';

export function ParametersAccordion() {
  const model = useModelStore((s) => s.model);
  const addParameter = useModelStore((s) => s.addParameter);
  const updateParameter = useModelStore((s) => s.updateParameter);
  const removeParameter = useModelStore((s) => s.removeParameter);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!model) return null;

  const handleAddParameter = () => {
    const id = nanoid();
    const newParam: Parameter = {
      id,
      name: `param${model.parameters.length + 1}`,
      type: 'number',
      value: 50,
      min: 0,
      max: 100,
      step: 1,
    };
    addParameter(newParam);
    setEditingId(id);
  };

  const addButton = (
    <button
      onClick={handleAddParameter}
      className="text-xs px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300"
    >
      + Add
    </button>
  );

  return (
    <Accordion 
      title="Parameters" 
      badge={model.parameters.length}
      action={addButton}
    >
      {model.parameters.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No parameters yet. Add parameters to create runtime-adjustable values.
        </p>
      ) : (
        <div className="space-y-3">
          {model.parameters.map((param) => (
            <ParameterItem
              key={param.id}
              param={param}
              isEditing={editingId === param.id}
              onStartEdit={() => setEditingId(param.id)}
              onEndEdit={() => setEditingId(null)}
              onUpdate={(changes) => updateParameter(param.id, changes)}
              onRemove={() => removeParameter(param.id)}
            />
          ))}
        </div>
      )}
    </Accordion>
  );
}

// ============================================================================
// ParameterItem
// ============================================================================

interface ParameterItemProps {
  param: Parameter;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  onUpdate: (changes: Partial<Parameter>) => void;
  onRemove: () => void;
}

function ParameterItem({ 
  param, 
  isEditing, 
  onStartEdit, 
  onEndEdit, 
  onUpdate, 
  onRemove 
}: ParameterItemProps) {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <div className="bg-gray-800 rounded-lg p-3 group">
      {/* Header row: name + value slider + delete */}
      <div className="flex items-center gap-2">
        {/* Name */}
        {isEditing ? (
          <input
            type="text"
            value={param.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onBlur={onEndEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') onEndEdit();
            }}
            autoFocus
            className="flex-1 bg-gray-700 border border-blue-500 rounded px-2 py-1 text-sm focus:outline-none"
          />
        ) : (
          <span
            className="flex-1 font-medium text-sm cursor-pointer hover:text-blue-400"
            onDoubleClick={onStartEdit}
            title="Double-click to rename"
          >
            {param.name}
          </span>
        )}

        {/* Config toggle */}
        <button
          onClick={() => setShowConfig(!showConfig)}
          className={`p-1 rounded transition ${
            showConfig ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
          }`}
          title="Configure"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition"
          title="Remove"
        >
          ×
        </button>
      </div>

      {/* Value control */}
      {param.type === 'number' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="range"
            value={param.value}
            onChange={(e) => onUpdate({ value: parseFloat(e.target.value) })}
            min={param.min ?? 0}
            max={param.max ?? 100}
            step={param.step ?? 1}
            className="flex-1 accent-blue-500"
          />
          <input
            type="number"
            value={param.value}
            onChange={(e) => onUpdate({ value: parseFloat(e.target.value) || 0 })}
            min={param.min}
            max={param.max}
            step={param.step}
            className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-right focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {param.type === 'boolean' && (
        <div className="mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!param.value}
              onChange={(e) => onUpdate({ value: e.target.checked })}
              className="accent-blue-500"
            />
            <span className="text-sm text-gray-400">
              {param.value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>
      )}

      {param.type === 'choice' && param.options && (
        <div className="mt-2">
          <select
            value={param.value}
            onChange={(e) => onUpdate({ value: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
          >
            {param.options.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}

      {/* Configuration panel */}
      {showConfig && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {/* Type selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-12">Type</label>
            <select
              value={param.type}
              onChange={(e) => {
                const type = e.target.value as Parameter['type'];
                const updates: Partial<Parameter> = { type };
                // Reset value when changing type
                if (type === 'number') {
                  updates.value = 50;
                  updates.min = 0;
                  updates.max = 100;
                  updates.step = 1;
                } else if (type === 'boolean') {
                  updates.value = false;
                } else if (type === 'choice') {
                  updates.options = ['Option 1', 'Option 2'];
                  updates.value = 'Option 1';
                }
                onUpdate(updates);
              }}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="choice">Choice</option>
            </select>
          </div>

          {/* Number-specific config */}
          {param.type === 'number' && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">Min</label>
                <input
                  type="number"
                  value={param.min ?? 0}
                  onChange={(e) => onUpdate({ min: parseFloat(e.target.value) || 0 })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">Max</label>
                <input
                  type="number"
                  value={param.max ?? 100}
                  onChange={(e) => onUpdate({ max: parseFloat(e.target.value) || 100 })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-12">Step</label>
                <input
                  type="number"
                  value={param.step ?? 1}
                  onChange={(e) => onUpdate({ step: parseFloat(e.target.value) || 1 })}
                  className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Choice-specific config */}
          {param.type === 'choice' && (
            <div className="flex items-start gap-2">
              <label className="text-xs text-gray-500 w-12 pt-1">Options</label>
              <textarea
                value={(param.options ?? []).join('\n')}
                onChange={(e) => {
                  const options = e.target.value.split('\n').filter(Boolean);
                  onUpdate({ options });
                }}
                placeholder="One option per line"
                rows={3}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
