'use client';

/**
 * useSimulation Hook
 * 
 * Manages the SimulationEngine for running Flocc simulations.
 * Handles compilation, initialization, and lifecycle.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import { compileModel } from './compiler';
import { SimulationEngine } from './SimulationEngine';

export function useSimulation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  
  const model = useModelStore((s) => s.model);
  const setEngine = useSimulationStore((s) => s.setEngine);
  const updateState = useSimulationStore((s) => s.updateState);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const speed = useSimulationStore((s) => s.speed);

  // Set container ref (called from Canvas component)
  const setContainer = useCallback((container: HTMLDivElement | null) => {
    containerRef.current = container;
  }, []);

  // Initialize or re-initialize simulation
  const initializeSimulation = useCallback(() => {
    const container = containerRef.current;
    if (!container || !model) return;

    // Only initialize if we have agent types and populations
    if (model.agentTypes.length === 0 || model.populations.length === 0) {
      return;
    }

    try {
      // Compile model
      const compiled = compileModel(model);

      // Create or reuse engine
      if (!engineRef.current) {
        engineRef.current = new SimulationEngine({
          container,
          onTick: (tick, agentCount) => {
            updateState(tick, agentCount);
          },
          onError: (error) => {
            console.error('Simulation error:', error);
          },
        });
        setEngine(engineRef.current);
      }

      // Initialize with compiled model and parameters
      engineRef.current.initialize(
        compiled.setup,
        compiled.agentTypes,
        compiled.envConfig,
        model.parameters
      );

      // Apply current speed setting
      engineRef.current.setSpeed(speed);

      // Reset status
      setStatus('idle');
    } catch (error) {
      console.error('Failed to compile model:', error);
    }
  }, [model, setEngine, updateState, setStatus, speed]);

  // Sync parameter changes to the running engine (for runtime adjustment)
  useEffect(() => {
    if (!engineRef.current || !model?.parameters) return;
    
    // Sync all parameters to the engine
    // This runs whenever parameters change in the store
    engineRef.current.syncParameters(model.parameters);
  }, [model?.parameters]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
        setEngine(null);
      }
    };
  }, [setEngine]);

  return {
    setContainer,
    initializeSimulation,
  };
}
