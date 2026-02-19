'use client';

/**
 * ParamInput
 * 
 * Input for behavior parameters that can toggle between:
 * - Literal value (direct input)
 * - Parameter reference (select from model parameters)
 */

import { useState, useEffect } from 'react';
import { useModelStore } from '@/stores/model';

interface ParamInputProps {
  value: any;
  onChange: (value: any) => void;
  type: 'number' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
}

export function ParamInput({
  value,
  onChange,
  type,
  min,
  max,
  step,
  defaultValue,
}: ParamInputProps) {
  const model = useModelStore((s) => s.model);
  const parameters = model?.parameters ?? [];

  // Check if current value is a parameter reference (starts with $)
  const isParamRef = typeof value === 'string' && value.startsWith('$');
  const [mode, setMode] = useState<'value' | 'param'>(isParamRef ? 'param' : 'value');

  // When value changes externally, sync the mode
  useEffect(() => {
    const shouldBeParamMode = typeof value === 'string' && value.startsWith('$');
    if (shouldBeParamMode !== (mode === 'param')) {
      setMode(shouldBeParamMode ? 'param' : 'value');
    }
  }, [value, mode]);

  // Filter parameters by compatible type
  const compatibleParams = parameters.filter((p) => {
    if (type === 'number') return p.type === 'number';
    if (type === 'boolean') return p.type === 'boolean';
    return true;
  });

  const handleToggle = () => {
    if (mode === 'value') {
      // Switch to param mode - select first compatible param or clear
      if (compatibleParams.length > 0) {
        onChange(`$${compatibleParams[0].name}`);
      }
      setMode('param');
    } else {
      // Switch to value mode - use default
      onChange(defaultValue ?? (type === 'number' ? 0 : false));
      setMode('value');
    }
  };

  const handleParamSelect = (paramName: string) => {
    onChange(`$${paramName}`);
  };

  const handleValueChange = (newValue: any) => {
    onChange(newValue);
  };

  // Get the current param name if in param mode
  const currentParamName = isParamRef ? value.slice(1) : null;

  return (
    <div className="flex items-center gap-1 flex-1">
      {mode === 'value' ? (
        <>
          {type === 'number' && (
            <input
              type="number"
              value={typeof value === 'number' ? value : (defaultValue ?? 0)}
              onChange={(e) => handleValueChange(parseFloat(e.target.value) || 0)}
              min={min}
              max={max}
              step={step}
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
            />
          )}
          {type === 'boolean' && (
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleValueChange(e.target.checked)}
              className="rounded bg-gray-700 border-gray-600"
            />
          )}
        </>
      ) : (
        <select
          value={currentParamName ?? ''}
          onChange={(e) => handleParamSelect(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
        >
          {compatibleParams.length === 0 ? (
            <option value="" disabled>No {type} parameters</option>
          ) : (
            compatibleParams.map((p) => (
              <option key={p.id} value={p.name}>
                ${p.name}
              </option>
            ))
          )}
        </select>
      )}

      {/* Toggle button - only show if there are compatible parameters */}
      {compatibleParams.length > 0 && (
        <button
          onClick={handleToggle}
          className={`p-1 rounded text-xs transition shrink-0 ${
            mode === 'param'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:text-white'
          }`}
          title={mode === 'value' ? 'Use parameter' : 'Use literal value'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mode === 'param' ? (
              // Link icon for param mode
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            ) : (
              // Variable icon for value mode
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
