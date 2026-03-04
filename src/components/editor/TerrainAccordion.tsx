'use client';

/**
 * TerrainAccordion
 *
 * Accordion section for terrain (cellular automaton layer) configuration.
 * Enable/disable, grayscale, color pickers, scale, init rule, update rule.
 */

import { useModelStore } from '@/stores/model';
import { Accordion } from '@/components/ui/Accordion';
import type { TerrainConfig, TerrainInitRule, TerrainUpdateRule } from '@/types';

const DEFAULT_TERRAIN: TerrainConfig = {
  enabled: false,
  grayscale: true,
  scale: 1,
  initRule: 'uniform-black',
  updateRule: 'none',
  colorLow: '#000000',
  colorHigh: '#ffffff',
};

// Labels differ based on whether grayscale is on
const INIT_RULE_LABELS: Record<TerrainInitRule, { grayscale: string; color: string }> = {
  'uniform-black': { grayscale: 'All Black',     color: 'All Low Color'  },
  'uniform-white': { grayscale: 'All White',     color: 'All High Color' },
  'random-bw':     { grayscale: 'Random B/W',    color: 'Random Low/High' },
  'random-gray':   { grayscale: 'Random Gray',   color: 'Random Gradient' },
};

const UPDATE_RULES: { value: TerrainUpdateRule; label: string; description: string }[] = [
  { value: 'none',         label: 'None',         description: 'Static terrain, no per-tick updates' },
  { value: 'game-of-life', label: 'Game of Life', description: "Conway's classic cellular automaton" },
  { value: 'diffusion',    label: 'Diffusion',    description: 'Values spread to neighboring cells' },
];

export function TerrainAccordion() {
  const model = useModelStore((s) => s.model);
  const updateTerrain = useModelStore((s) => s.updateTerrain);

  if (!model) return null;

  const terrain: TerrainConfig = {
    ...DEFAULT_TERRAIN,
    ...model.terrain,
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

            {/* Color pickers — shown when grayscale is off */}
            {!terrain.grayscale && (
              <div className="space-y-2">
                <ColorRow
                  label="Low / Dead"
                  value={terrain.colorLow ?? '#000000'}
                  onChange={(v) => updateTerrain({ colorLow: v })}
                />
                <ColorRow
                  label="High / Alive"
                  value={terrain.colorHigh ?? '#ffffff'}
                  onChange={(v) => updateTerrain({ colorHigh: v })}
                />
              </div>
            )}

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
                {(Object.keys(INIT_RULE_LABELS) as TerrainInitRule[]).map((value) => (
                  <option key={value} value={value}>
                    {terrain.grayscale
                      ? INIT_RULE_LABELS[value].grayscale
                      : INIT_RULE_LABELS[value].color}
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

            <p className="text-xs text-gray-600 italic">
              Changing terrain settings requires restarting the simulation.
            </p>
          </>
        )}
      </div>
    </Accordion>
  );
}

// ============================================================================
// Color Row
// ============================================================================

interface ColorRowProps {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}

function ColorRow({ label, value, onChange }: ColorRowProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Native color picker */}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-gray-700 bg-transparent p-0.5"
        title={label}
      />
      {/* Hex input */}
      <input
        type="text"
        value={value}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
      />
      <span className="text-xs text-gray-500 w-16 shrink-0">{label}</span>
    </div>
  );
}
