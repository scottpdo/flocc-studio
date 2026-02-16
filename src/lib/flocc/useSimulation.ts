'use client';

/**
 * useSimulation Hook
 * 
 * Manages the Web Worker for running Flocc simulations.
 * Handles compilation, initialization, and state updates.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';
import { compileModel } from './compiler';

export function useSimulation() {
  const workerRef = useRef<Worker | null>(null);
  const model = useModelStore((s) => s.model);
  const setWorker = useSimulationStore((s) => s.setWorker);
  const updateFromWorker = useSimulationStore((s) => s.updateFromWorker);

  // Initialize worker
  useEffect(() => {
    // Create worker
    const worker = new Worker(
      new URL('../../workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;
    setWorker(worker);

    // Handle messages from worker
    worker.onmessage = (event) => {
      const message = event.data;

      if (message.type === 'state') {
        updateFromWorker({
          tick: message.tick,
          agents: message.agents,
        });
      } else if (message.type === 'error') {
        console.error('Simulation error:', message.message);
      }
    };

    // Cleanup
    return () => {
      worker.terminate();
      workerRef.current = null;
      setWorker(null);
    };
  }, [setWorker, updateFromWorker]);

  // Compile and send model to worker when model changes
  const initializeSimulation = useCallback(() => {
    const worker = workerRef.current;
    if (!worker || !model) return;

    // Only initialize if we have agent types and populations
    if (model.agentTypes.length === 0 || model.populations.length === 0) {
      return;
    }

    try {
      const modelCode = compileModel(model);
      worker.postMessage({ type: 'init', modelCode });
    } catch (error) {
      console.error('Failed to compile model:', error);
    }
  }, [model]);

  return {
    initializeSimulation,
  };
}
