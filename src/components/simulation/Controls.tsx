'use client';

/**
 * Controls
 * 
 * Playback controls for the simulation.
 */

import { useSimulationStore } from '@/stores/simulation';

interface ControlsProps {
  onReset?: () => void;
}

export function Controls({ onReset }: ControlsProps) {
  const status = useSimulationStore((s) => s.status);
  const tick = useSimulationStore((s) => s.tick);
  const speed = useSimulationStore((s) => s.speed);
  const agentCount = useSimulationStore((s) => s.agentCount);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const step = useSimulationStore((s) => s.step);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);

  const handleReset = () => {
    reset();
    onReset?.();
  };

  return (
    <div className="h-14 border-t border-gray-800 bg-gray-900 flex items-center px-4 gap-4 shrink-0">
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        {status === 'running' ? (
          <button
            onClick={pause}
            className="p-2 rounded bg-yellow-600 hover:bg-yellow-500 transition"
            title="Pause"
          >
            ⏸
          </button>
        ) : (
          <button
            onClick={play}
            className="p-2 rounded bg-green-600 hover:bg-green-500 transition"
            title="Play"
          >
            ▶
          </button>
        )}
        <button
          onClick={step}
          disabled={status === 'running'}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Step"
        >
          ⏭
        </button>
        <button
          onClick={handleReset}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition"
          title="Reset"
        >
          ↺
        </button>
      </div>

      <div className="h-6 w-px bg-gray-700" />

      {/* Tick counter */}
      <div className="text-sm text-gray-400">
        Tick: <span className="font-mono text-white">{tick}</span>
      </div>

      <div className="h-6 w-px bg-gray-700" />

      {/* Agent count */}
      <div className="text-sm text-gray-400">
        Agents: <span className="font-mono text-white">{agentCount}</span>
      </div>

      <div className="h-6 w-px bg-gray-700" />

      {/* Speed control */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Speed:</span>
        <input
          type="range"
          min={1}
          max={10}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-24 accent-blue-500"
        />
        <span className="text-sm font-mono w-6">{speed}x</span>
      </div>

      <div className="flex-1" />

      {/* Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            status === 'running'
              ? 'bg-green-500 animate-pulse'
              : status === 'paused'
              ? 'bg-yellow-500'
              : 'bg-gray-500'
          }`}
        />
        <span className="text-sm text-gray-400 capitalize">{status}</span>
      </div>
    </div>
  );
}
