/**
 * Simulation Store — Zustand store for runtime simulation state
 * Tracks playback state, current tick, agent snapshots, and metrics
 */

import { create } from 'zustand';
import type { AgentSnapshot, SimulationState } from '@/types';

// ============================================================================
// Store Interface
// ============================================================================

interface SimulationStore extends SimulationState {
  // Playback control
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;

  // State updates (called from worker)
  setTick: (tick: number) => void;
  setAgents: (agents: AgentSnapshot[]) => void;
  setMetrics: (metrics: Record<string, number>) => void;
  updateFromWorker: (data: { tick: number; agents: AgentSnapshot[]; metrics?: Record<string, number> }) => void;

  // Speed control
  speed: number; // ticks per frame
  setSpeed: (speed: number) => void;

  // Worker reference
  worker: Worker | null;
  setWorker: (worker: Worker | null) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  status: 'idle',
  tick: 0,
  agents: [],
  metrics: {},
  speed: 1,
  worker: null,

  // Playback control
  play: () => {
    const { worker, status } = get();
    if (worker && status !== 'running') {
      worker.postMessage({ type: 'play' });
      set({ status: 'running' });
    }
  },

  pause: () => {
    const { worker, status } = get();
    if (worker && status === 'running') {
      worker.postMessage({ type: 'pause' });
      set({ status: 'paused' });
    }
  },

  step: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'step' });
    }
  },

  reset: () => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'reset' });
      set({ status: 'idle', tick: 0, agents: [], metrics: {} });
    }
  },

  // State updates
  setTick: (tick) => set({ tick }),
  setAgents: (agents) => set({ agents }),
  setMetrics: (metrics) => set({ metrics }),

  updateFromWorker: (data) =>
    set({
      tick: data.tick,
      agents: data.agents,
      metrics: data.metrics ?? get().metrics,
    }),

  // Speed control
  setSpeed: (speed) => {
    const { worker } = get();
    if (worker) {
      worker.postMessage({ type: 'set-speed', ticksPerFrame: speed });
    }
    set({ speed });
  },

  // Worker management
  setWorker: (worker) => set({ worker }),
}));
