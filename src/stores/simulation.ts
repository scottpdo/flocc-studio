/**
 * Simulation Store — Zustand store for runtime simulation state
 * Tracks playback state, current tick, and agent count
 * 
 * Now uses main-thread SimulationEngine instead of Web Worker
 */

import { create } from 'zustand';
import type { SimulationEngine } from '@/lib/flocc/SimulationEngine';

// ============================================================================
// Store Interface
// ============================================================================

type SimulationStatus = 'idle' | 'running' | 'paused';

interface SimulationStore {
  // State
  status: SimulationStatus;
  tick: number;
  agentCount: number;
  speed: number;

  // Engine reference
  engine: SimulationEngine | null;
  setEngine: (engine: SimulationEngine | null) => void;

  // Playback control
  play: () => void;
  pause: () => void;
  step: () => void;
  reset: () => void;

  // State updates (called from engine)
  setTick: (tick: number) => void;
  setAgentCount: (count: number) => void;
  updateState: (tick: number, agentCount: number) => void;

  // Speed control
  setSpeed: (speed: number) => void;

  // Status
  setStatus: (status: SimulationStatus) => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  // Initial state
  status: 'idle',
  tick: 0,
  agentCount: 0,
  speed: 1,
  engine: null,

  // Engine management
  setEngine: (engine) => set({ engine }),

  // Playback control
  play: () => {
    const { engine, status } = get();
    if (engine && status !== 'running') {
      engine.play();
      set({ status: 'running' });
    }
  },

  pause: () => {
    const { engine, status } = get();
    if (engine && status === 'running') {
      engine.pause();
      set({ status: 'paused' });
    }
  },

  step: () => {
    const { engine } = get();
    if (engine) {
      engine.step();
      set({ 
        status: 'paused',
        tick: engine.getTick(),
        agentCount: engine.getAgentCount(),
      });
    }
  },

  reset: () => {
    const { engine } = get();
    if (engine) {
      engine.reset();
      set({ 
        status: 'idle', 
        tick: 0, 
        agentCount: engine.getAgentCount(),
      });
    }
  },

  // State updates
  setTick: (tick) => set({ tick }),
  setAgentCount: (agentCount) => set({ agentCount }),
  updateState: (tick, agentCount) => set({ tick, agentCount }),

  // Speed control
  setSpeed: (speed) => {
    const { engine } = get();
    if (engine) {
      engine.setSpeed(speed);
    }
    set({ speed });
  },

  // Status
  setStatus: (status) => set({ status }),
}));
