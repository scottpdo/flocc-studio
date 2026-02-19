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
  const parameters = useModelStore((s) => s.model?.parameters);
  const setEngine = useSimulationStore((s) => s.setEngine);
  const updateState = useSimulationStore((s) => s.updateState);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const speed = useSimulationStore((s) => s.speed);
  
  // Track model structure separately from parameters to avoid unnecessary re-inits
  const modelStructureRef = useRef<string | null>(null);

  // Set container ref (called from Canvas component)
  const setContainer = useCallback((container: HTMLDivElement | null) => {
    containerRef.current = container;
  }, []);

  // Compute a hash of model structure (excluding parameters) to detect structural changes
  const getStructureHash = useCallback(() => {
    if (!model) return null;
    // Hash based on agent types, populations, and environment - NOT parameters
    return JSON.stringify({
      agentTypes: model.agentTypes,
      populations: model.populations,
      environment: model.environment,
    });
  }, [model]);

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
      
      // Track current structure
      modelStructureRef.current = getStructureHash();
    } catch (error) {
      console.error('Failed to compile model:', error);
    }
  }, [setEngine, updateState, setStatus, speed, getStructureHash()]);

  // Sync parameter changes to the running engine (for runtime adjustment)
  // This should NOT trigger re-initialization, only update the environment values
  useEffect(() => {
    if (!engineRef.current || !parameters) return;
    
    // Only sync if engine is already initialized (structure hasn't changed)
    const currentHash = getStructureHash();
    if (modelStructureRef.current === currentHash) {
      // Structure is the same, just sync parameters
      engineRef.current.syncParameters(parameters);
    }
    // If structure changed, initializeSimulation will be called separately
  }, [parameters, getStructureHash]);

  // Detect structural changes and re-initialize (but not for parameter-only changes)
  useEffect(() => {
    if (!model || !containerRef.current) return;
    
    const currentHash = getStructureHash();
    
    // Skip if structure hasn't changed (e.g., only parameters changed)
    if (modelStructureRef.current === currentHash) return;
    
    // Structure changed - need to re-initialize after a short delay
    const timeout = setTimeout(() => {
      initializeSimulation();
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [model?.agentTypes, model?.populations, model?.environment, getStructureHash, initializeSimulation]);

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
