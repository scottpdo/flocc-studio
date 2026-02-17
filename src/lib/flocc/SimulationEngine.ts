/**
 * SimulationEngine
 * 
 * Runs Flocc simulations on the main thread with CanvasRenderer.
 * Manages the Environment, rendering, and animation loop.
 */

import { Environment, Agent, CanvasRenderer, utils } from 'flocc';
import type { StudioModel, AgentType } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface SimulationEngineOptions {
  container: HTMLDivElement;
  onTick?: (tick: number, agentCount: number) => void;
  onError?: (error: Error) => void;
}

export interface AgentTypeMetadata {
  id: string;
  name: string;
  color: string;
  shape: string;
  size: number;
}

// ============================================================================
// SimulationEngine Class
// ============================================================================

export class SimulationEngine {
  private env: Environment | null = null;
  private renderer: CanvasRenderer | null = null;
  private container: HTMLDivElement;
  private isRunning: boolean = false;
  private tickCount: number = 0;
  private ticksPerFrame: number = 1;
  private animationId: number | null = null;
  private agentIdCounter: number = 0;
  private agentTypeMetadata: Map<string, AgentTypeMetadata> = new Map();
  private setupFn: ((env: Environment) => void) | null = null;
  
  private onTick?: (tick: number, agentCount: number) => void;
  private onError?: (error: Error) => void;

  constructor(options: SimulationEngineOptions) {
    this.container = options.container;
    this.onTick = options.onTick;
    this.onError = options.onError;
  }

  /**
   * Initialize the simulation with a compiled model
   */
  initialize(
    setupFn: (env: Environment) => void,
    agentTypes: Map<string, AgentTypeMetadata>,
    envConfig: { width: number; height: number; wraparound: boolean; backgroundColor?: string }
  ): void {
    this.cleanup();

    try {
      // Store setup function for reset
      this.setupFn = setupFn;
      this.agentTypeMetadata = agentTypes;

      // Reset counters
      this.tickCount = 0;
      this.agentIdCounter = 0;

      // Create environment with torus option
      this.env = new Environment({
        torus: envConfig.wraparound,
        width: envConfig.width,
        height: envConfig.height,
      });

      // Run setup to create agents
      setupFn(this.env);

      // Assign IDs and apply visual properties to agents
      for (const agent of this.env.getAgents()) {
        agent.set('_id', `agent_${this.agentIdCounter++}`);
        this.applyAgentVisuals(agent);
      }

      // Create renderer
      this.renderer = new CanvasRenderer(this.env, {
        width: envConfig.width,
        height: envConfig.height,
        background: envConfig.backgroundColor || '#1a1a2e',
      });

      // Mount canvas
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.canvas);

      // Initial render
      this.renderer.render();

      // Notify
      this.onTick?.(this.tickCount, this.env.getAgents().length);
    } catch (error) {
      this.onError?.(error as Error);
    }
  }

  /**
   * Apply visual properties (color, shape, size) to an agent based on its type
   */
  private applyAgentVisuals(agent: Agent): void {
    const typeId = agent.get('typeId') as string;
    const metadata = this.agentTypeMetadata.get(typeId);
    
    if (metadata) {
      agent.set('color', metadata.color);
      agent.set('size', metadata.size);
      
      // Map studio shapes to Flocc renderer shapes
      // Use 'arrow' for triangle when agent has velocity (for flocking)
      const hasVelocity = agent.get('vx') !== null || agent.get('vy') !== null;
      if (metadata.shape === 'triangle' && hasVelocity) {
        agent.set('shape', 'arrow');
      } else if (metadata.shape === 'square') {
        agent.set('shape', 'rect');
        agent.set('width', metadata.size);
        agent.set('height', metadata.size);
      } else {
        agent.set('shape', metadata.shape);
      }
    }
  }

  /**
   * Start the simulation loop
   */
  play(): void {
    if (!this.env || this.isRunning) return;
    this.isRunning = true;
    this.runLoop();
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Run a single tick
   */
  step(): void {
    if (!this.env) return;
    this.pause();
    this.tick();
    this.render();
    this.onTick?.(this.tickCount, this.env.getAgents().length);
  }

  /**
   * Reset the simulation to initial state
   */
  reset(): void {
    if (!this.env || !this.setupFn) return;

    this.pause();
    this.tickCount = 0;
    this.agentIdCounter = 0;

    // Clear existing agents
    const agents = [...this.env.getAgents()];
    for (const agent of agents) {
      this.env.removeAgent(agent);
    }

    // Re-run setup
    this.setupFn(this.env);

    // Assign IDs and visuals
    for (const agent of this.env.getAgents()) {
      agent.set('_id', `agent_${this.agentIdCounter++}`);
      this.applyAgentVisuals(agent);
    }

    this.render();
    this.onTick?.(this.tickCount, this.env.getAgents().length);
  }

  /**
   * Set simulation speed (ticks per frame)
   */
  setSpeed(ticksPerFrame: number): void {
    this.ticksPerFrame = Math.max(1, ticksPerFrame);
  }

  /**
   * Get current tick count
   */
  getTick(): number {
    return this.tickCount;
  }

  /**
   * Get current agent count
   */
  getAgentCount(): number {
    return this.env?.getAgents().length ?? 0;
  }

  /**
   * Check if simulation is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.pause();
    
    if (this.renderer) {
      this.container.innerHTML = '';
      this.renderer = null;
    }
    
    this.env = null;
    this.setupFn = null;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private runLoop = (): void => {
    if (!this.isRunning || !this.env) return;

    // Run multiple ticks per frame based on speed
    for (let i = 0; i < this.ticksPerFrame; i++) {
      this.tick();
    }

    this.render();
    this.onTick?.(this.tickCount, this.env.getAgents().length);

    // Schedule next frame
    this.animationId = requestAnimationFrame(this.runLoop);
  };

  private tick(): void {
    if (!this.env) return;

    // Apply visuals to any new agents (from reproduction)
    const agents = this.env.getAgents();
    for (const agent of agents) {
      if (agent.get('_id') === null) {
        agent.set('_id', `agent_${this.agentIdCounter++}`);
        this.applyAgentVisuals(agent);
      }
    }

    this.env.tick();
    this.tickCount++;
  }

  private render(): void {
    if (!this.renderer) return;
    this.renderer.render();
  }
}
