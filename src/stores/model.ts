/**
 * Model Store — Zustand store for model definition
 * Handles the current model being edited with undo/redo support
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import type { StudioModel, AgentType, Behavior, Population, Parameter } from '@/types';

// ============================================================================
// Default Model
// ============================================================================

export function createDefaultModel(): StudioModel {
  return {
    id: nanoid(),
    name: 'Untitled Model',
    description: '',
    environment: {
      width: 800,
      height: 800,
      wraparound: true,
      backgroundColor: '#1a1a2e',
    },
    agentTypes: [],
    populations: [],
    parameters: [],
    tags: [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
    isFeatured: false,
    forkCount: 0,
    viewCount: 0,
  };
}

// ============================================================================
// Store Interface
// ============================================================================

interface ModelState {
  model: StudioModel | null;
  isDirty: boolean;
}

interface ModelActions {
  // Model lifecycle
  setModel: (model: StudioModel) => void;
  newModel: () => void;
  clearModel: () => void;
  markClean: () => void;

  // Model metadata
  updateName: (name: string) => void;
  updateDescription: (description: string) => void;
  updateEnvironment: (env: Partial<StudioModel['environment']>) => void;

  // Agent types
  addAgentType: (agentType: AgentType) => void;
  updateAgentType: (id: string, changes: Partial<AgentType>) => void;
  removeAgentType: (id: string) => void;

  // Behaviors
  addBehavior: (agentTypeId: string, behavior: Behavior) => void;
  updateBehavior: (agentTypeId: string, behaviorId: string, changes: Partial<Behavior>) => void;
  removeBehavior: (agentTypeId: string, behaviorId: string) => void;

  // Populations
  addPopulation: (population: Population) => void;
  updatePopulation: (id: string, changes: Partial<Population>) => void;
  removePopulation: (id: string) => void;

  // Parameters
  addParameter: (parameter: Parameter) => void;
  updateParameter: (id: string, changes: Partial<Parameter>) => void;
  removeParameter: (id: string) => void;
}

type ModelStore = ModelState & ModelActions;

// ============================================================================
// Store Implementation
// ============================================================================

export const useModelStore = create<ModelStore>()(
  temporal(
    immer((set) => ({
      // State
      model: null,
      isDirty: false,

      // Model lifecycle
      setModel: (model) =>
        set((state) => {
          state.model = model;
          state.isDirty = false;
        }),

      newModel: () =>
        set((state) => {
          state.model = createDefaultModel();
          state.isDirty = false;
        }),

      clearModel: () =>
        set((state) => {
          state.model = null;
          state.isDirty = false;
        }),

      markClean: () =>
        set((state) => {
          state.isDirty = false;
        }),

      // Model metadata
      updateName: (name) =>
        set((state) => {
          if (state.model) {
            state.model.name = name;
            state.isDirty = true;
          }
        }),

      updateDescription: (description) =>
        set((state) => {
          if (state.model) {
            state.model.description = description;
            state.isDirty = true;
          }
        }),

      updateEnvironment: (env) =>
        set((state) => {
          if (state.model) {
            state.model.environment = { ...state.model.environment, ...env };
            state.isDirty = true;
          }
        }),

      // Agent types
      addAgentType: (agentType) =>
        set((state) => {
          if (state.model) {
            state.model.agentTypes.push(agentType);
            state.isDirty = true;
          }
        }),

      updateAgentType: (id, changes) =>
        set((state) => {
          if (state.model) {
            const index = state.model.agentTypes.findIndex((t) => t.id === id);
            if (index !== -1) {
              state.model.agentTypes[index] = { ...state.model.agentTypes[index], ...changes };
              state.isDirty = true;
            }
          }
        }),

      removeAgentType: (id) =>
        set((state) => {
          if (state.model) {
            state.model.agentTypes = state.model.agentTypes.filter((t) => t.id !== id);
            state.model.populations = state.model.populations.filter((p) => p.agentTypeId !== id);
            state.isDirty = true;
          }
        }),

      // Behaviors
      addBehavior: (agentTypeId, behavior) =>
        set((state) => {
          if (state.model) {
            const agentType = state.model.agentTypes.find((t) => t.id === agentTypeId);
            if (agentType) {
              agentType.behaviors.push(behavior);
              state.isDirty = true;
            }
          }
        }),

      updateBehavior: (agentTypeId, behaviorId, changes) =>
        set((state) => {
          if (state.model) {
            const agentType = state.model.agentTypes.find((t) => t.id === agentTypeId);
            if (agentType) {
              const index = agentType.behaviors.findIndex((b) => b.id === behaviorId);
              if (index !== -1) {
                agentType.behaviors[index] = { ...agentType.behaviors[index], ...changes };
                state.isDirty = true;
              }
            }
          }
        }),

      removeBehavior: (agentTypeId, behaviorId) =>
        set((state) => {
          if (state.model) {
            const agentType = state.model.agentTypes.find((t) => t.id === agentTypeId);
            if (agentType) {
              agentType.behaviors = agentType.behaviors.filter((b) => b.id !== behaviorId);
              state.isDirty = true;
            }
          }
        }),

      // Populations
      addPopulation: (population) =>
        set((state) => {
          if (state.model) {
            state.model.populations.push(population);
            state.isDirty = true;
          }
        }),

      updatePopulation: (id, changes) =>
        set((state) => {
          if (state.model) {
            const index = state.model.populations.findIndex((p) => p.id === id);
            if (index !== -1) {
              state.model.populations[index] = { ...state.model.populations[index], ...changes };
              state.isDirty = true;
            }
          }
        }),

      removePopulation: (id) =>
        set((state) => {
          if (state.model) {
            state.model.populations = state.model.populations.filter((p) => p.id !== id);
            state.isDirty = true;
          }
        }),

      // Parameters
      addParameter: (parameter) =>
        set((state) => {
          if (state.model) {
            state.model.parameters.push(parameter);
            state.isDirty = true;
          }
        }),

      updateParameter: (id, changes) =>
        set((state) => {
          if (state.model) {
            const index = state.model.parameters.findIndex((p) => p.id === id);
            if (index !== -1) {
              state.model.parameters[index] = { ...state.model.parameters[index], ...changes };
              state.isDirty = true;
            }
          }
        }),

      removeParameter: (id) =>
        set((state) => {
          if (state.model) {
            state.model.parameters = state.model.parameters.filter((p) => p.id !== id);
            state.isDirty = true;
          }
        }),
    })),
    {
      // Temporal (undo/redo) options
      limit: 50, // Max history size
      partialize: (state) => ({ model: state.model }), // Only track model changes
    }
  )
);

// ============================================================================
// Temporal Helpers
// ============================================================================

// Access temporal state directly
export const useTemporalStore = () => useModelStore.temporal;

export function useModelUndo() {
  return useModelStore.temporal.getState().undo;
}

export function useModelRedo() {
  return useModelStore.temporal.getState().redo;
}

export function useCanUndo() {
  const pastStates = useModelStore.temporal.getState().pastStates;
  return pastStates.length > 0;
}

export function useCanRedo() {
  const futureStates = useModelStore.temporal.getState().futureStates;
  return futureStates.length > 0;
}
