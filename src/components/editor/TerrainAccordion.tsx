'use client';

/**
 * TerrainAccordion
 *
 * Accordion section for terrain (cellular automaton layer) configuration.
 * Enable/disable, grayscale, scale, init rule, update rule.
 */

import { useModelStore } from '@/stores/model';
import { Accordion } from '@/components/ui/Accordion';
import type { TerrainInitRule, TerrainUpdateRule } from '@/types';

const INIT_RULES: { value: TerrainInitRule; label: string }[] = [
  { value: 'uniform-black', label: 'All Black' },
  { value: 'uniform-white', label: 'All White' },
  { value: 'random-bw', label: 'Random B/W' },
  { value: 'random-gray', label: 'Random Gray' },
];

const UPDATE_RULES: { value: TerrainUpdateRule; label: string; description: string }[] = [
  { value: 'none', label: 'None', description: 'Static terrain, no per-tick updates' },
  { value: 'game-of-life', label: 'Game of Life', description: 'Conway\'s classic cellular automaton' },
  { value: 'diffusion', label: 'Diffusion', description: 'Values spread to neighboring cells' },
];

export function TerrainAccordion() {
  const model = useModelStore((s) => s.model);
  const updateTerrain = useModelStore((s) => s.updateTerrain);

  if (!model) return null;

  const terrain = model.terrain ?? {
    enabled: false,
    grayscale: true,
    scale: 1,
    initRule: 'uniform-black' as const,
    updateRule: 'none' as const,
  };

  return (
    <Accordion title="Terrain">
      <div className="space-y-4">
        {/* Enable toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={terrain.enabled}
            onChange={(e) => updateTerrain({ enabled: e.target.checked })}
            className="w-4 h-4 accent-blue-500"
          />
          <div>
            <span className="text-sm">Enable Terrain</span>
            <p className="text-xs text-gray-500">
              Adds a pixel grid layer to the environment
            </p>
          </div>
        </label>

        {terrain.enabled && (
          <>
            {/* Grayscale toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={terrain.grayscale}
                onChange={(e) => updateTerrain({ grayscale: e.target.checked })}
                className="w-4 h-4 accent-blue-500"
              />
              <span className="text-sm">Grayscale</span>
            </label>

            {/* Scale */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Cell Scale ({terrain.scale}px)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={terrain.scale}
                onChange={(e) => updateTerrain({ scale: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600">
                <span>1px</span>
                <span>10px</span>
              </div>
            </div>

            {/* Init Rule */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Initial Pattern</label>
              <select
                value={terrain.initRule}
                onChange={(e) => updateTerrain({ initRule: e.target.value as TerrainInitRule })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {INIT_RULES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Update Rule */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Update Rule</label>
              <select
                value={terrain.updateRule}
                onChange={(e) => updateTerrain({ updateRule: e.target.value as TerrainUpdateRule })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                {UPDATE_RULES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-1">
                {UPDATE_RULES.find((r) => r.value === terrain.updateRule)?.description}
              </p>
            </div>

            {/* Info note */}
            <p className="text-xs text-gray-600 italic">
              Changing terrain settings requires restarting the simulation.
            </p>
          </>
        )}
      </div>
    </Accordion>
  );
}
