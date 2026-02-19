'use client';

/**
 * EnvironmentAccordion
 * 
 * Accordion section for environment configuration.
 * Width, height, wraparound, background color.
 */

import { useModelStore } from '@/stores/model';
import { Accordion } from '@/components/ui/Accordion';

export function EnvironmentAccordion() {
  const model = useModelStore((s) => s.model);
  const updateEnvironment = useModelStore((s) => s.updateEnvironment);

  if (!model) return null;

  const env = model.environment;

  return (
    <Accordion title="Environment">
      <div className="space-y-4">
        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Width</label>
            <input
              type="number"
              value={env.width}
              onChange={(e) => updateEnvironment({ width: parseInt(e.target.value) || 400 })}
              min={100}
              max={2000}
              step={50}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Height</label>
            <input
              type="number"
              value={env.height}
              onChange={(e) => updateEnvironment({ height: parseInt(e.target.value) || 400 })}
              min={100}
              max={2000}
              step={50}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Wraparound toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={env.wraparound}
              onChange={(e) => updateEnvironment({ wraparound: e.target.checked })}
              className="w-4 h-4 accent-blue-500"
            />
            <div>
              <span className="text-sm">Wraparound (Torus)</span>
              <p className="text-xs text-gray-500">
                Agents exiting one edge appear on the opposite side
              </p>
            </div>
          </label>
        </div>

        {/* Background color */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Background Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={env.backgroundColor || '#1a1a2e'}
              onChange={(e) => updateEnvironment({ backgroundColor: e.target.value })}
              className="w-10 h-10 rounded cursor-pointer border border-gray-700"
            />
            <input
              type="text"
              value={env.backgroundColor || '#1a1a2e'}
              onChange={(e) => updateEnvironment({ backgroundColor: e.target.value })}
              placeholder="#1a1a2e"
              className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Info note */}
        <p className="text-xs text-gray-600 italic">
          Changing dimensions requires restarting the simulation.
        </p>
      </div>
    </Accordion>
  );
}
