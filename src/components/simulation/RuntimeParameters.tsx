'use client';

/**
 * RuntimeParameters
 * 
 * A compact panel showing model parameters as adjustable sliders.
 * Used in the model View page for runtime adjustment.
 */

import { useModelStore } from '@/stores/model';

export function RuntimeParameters() {
  const model = useModelStore((s) => s.model);
  const updateParameter = useModelStore((s) => s.updateParameter);

  if (!model || model.parameters.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Parameters</h3>
      <div className="space-y-4">
        {model.parameters.map((param) => (
          <div key={param.id}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm">{param.name}</label>
              {param.type === 'number' && (
                <span className="text-sm text-gray-500 font-mono">
                  {param.value}
                </span>
              )}
            </div>

            {param.type === 'number' && (
              <input
                type="range"
                value={param.value}
                onChange={(e) => updateParameter(param.id, { value: parseFloat(e.target.value) })}
                min={param.min ?? 0}
                max={param.max ?? 100}
                step={param.step ?? 1}
                className="w-full accent-blue-500"
              />
            )}

            {param.type === 'boolean' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!param.value}
                  onChange={(e) => updateParameter(param.id, { value: e.target.checked })}
                  className="accent-blue-500"
                />
                <span className="text-sm text-gray-400">
                  {param.value ? 'On' : 'Off'}
                </span>
              </label>
            )}

            {param.type === 'choice' && param.options && (
              <select
                value={param.value}
                onChange={(e) => updateParameter(param.id, { value: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
              >
                {param.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
