/**
 * SimulationEngine
 * 
 * Runs Flocc simulations on the main thread with CanvasRenderer.
 * Manages the Environment, rendering, and animation loop.
 */

import { Environment, Agent, CanvasRenderer, LineChartRenderer, utils, KDTree } from 'flocc';
import type { StudioModel, AgentType, Parameter, Visualization } from '@/types';

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
  private parameters: Parameter[] = [];
  private visualizations: Visualization[] = [];
  private chartRenderers: Map<string, LineChartRenderer> = new Map();
  
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
    envConfig: { width: number; height: number; wraparound: boolean; backgroundColor?: string },
    parameters: Parameter[] = [],
    visualizations: Visualization[] = []
  ): void {
    this.cleanup();

    try {
      // Store setup function for reset
      this.setupFn = setupFn;
      this.agentTypeMetadata = agentTypes;
      this.parameters = parameters;

      // Reset counters
      this.tickCount = 0;
      this.agentIdCounter = 0;

      // Create environment with torus option
      this.env = new Environment({
        torus: envConfig.wraparound,
        width: envConfig.width,
        height: envConfig.height,
      });

      // Store parameters on the environment for runtime access
      this.syncParametersToEnv();

      // Run setup to create agents
      setupFn(this.env);

      // Assign IDs and apply visual properties to agents
      for (const agent of this.env.getAgents()) {
        agent.set('_id', `agent_${this.agentIdCounter++}`);
        this.applyAgentVisuals(agent);
      }

      this.env.use(new KDTree(this.env.getAgents()));

      // Create renderer
      this.renderer = new CanvasRenderer(this.env, {
        width: envConfig.width,
        height: envConfig.height,
        background: envConfig.backgroundColor || '#1a1a2e',
      });

      // Mount canvas
      this.container.innerHTML = '';
      this.container.appendChild(this.renderer.canvas);

      // Initialize visualizations (line charts)
      this.visualizations = visualizations;
      this.initializeCharts();

      // Initial render
      this.renderer.render();
      this.renderCharts();

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
      if (metadata.shape === 'square') {
        agent.set('shape', 'rect');
        agent.set('width', metadata.size);
        agent.set('height', metadata.size);
      } else {
        // circle, triangle, and arrow pass through directly
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

    // Re-sync parameters (they may have changed)
    this.syncParametersToEnv();

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
   * Update a parameter value at runtime
   * This allows parameters to be adjusted while the simulation is running
   */
  updateParameter(name: string, value: any): void {
    if (!this.env) return;
    
    // Update local cache
    const param = this.parameters.find(p => p.name === name);
    if (param) {
      param.value = value;
    }
    
    // Update environment
    this.env.set(name, value);
  }

  /**
   * Update all parameters from a new parameter array
   * Called when the model store changes
   */
  syncParameters(parameters: Parameter[]): void {
    this.parameters = parameters;
    this.syncParametersToEnv();
  }

  /**
   * Sync stored parameters to the environment
   */
  private syncParametersToEnv(): void {
    if (!this.env) return;
    for (const param of this.parameters) {
      this.env.set(param.name, param.value);
    }
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
   * Capture a thumbnail of the current canvas state
   * Returns a base64 data URL, resized to specified max dimension
   */
  captureThumbnail(maxSize: number = 400): string | null {
    if (!this.renderer?.canvas) return null;

    const canvas = this.renderer.canvas;
    
    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    // Calculate scaled dimensions (maintain aspect ratio)
    const scale = Math.min(maxSize / canvas.width, maxSize / canvas.height);
    tempCanvas.width = Math.round(canvas.width * scale);
    tempCanvas.height = Math.round(canvas.height * scale);

    // Draw scaled image
    ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    // Return as JPEG data URL (smaller than PNG)
    return tempCanvas.toDataURL('image/jpeg', 0.8);
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
    
    // Clean up chart renderers
    this.chartRenderers.clear();
    this.visualizations = [];
    
    this.env = null;
    this.setupFn = null;
  }

  /**
   * Get chart canvas for a visualization by ID
   * Returns null if visualization doesn't exist or isn't enabled
   */
  getChartCanvas(visualizationId: string): HTMLCanvasElement | null {
    const renderer = this.chartRenderers.get(visualizationId);
    return renderer?.canvas ?? null;
  }

  /**
   * Get all chart canvases (for enabled visualizations)
   */
  getAllChartCanvases(): Map<string, HTMLCanvasElement> {
    const canvases = new Map<string, HTMLCanvasElement>();
    for (const [id, renderer] of this.chartRenderers) {
      canvases.set(id, renderer.canvas);
    }
    return canvases;
  }

  /**
   * Update visualizations configuration (e.g., when user adds/removes charts)
   */
  updateVisualizations(visualizations: Visualization[]): void {
    this.visualizations = visualizations;
    this.initializeCharts();
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
    this.renderCharts();
  }

  /**
   * Initialize LineChartRenderers for enabled visualizations
   */
  private initializeCharts(): void {
    if (!this.env) return;

    // Clear existing chart renderers
    this.chartRenderers.clear();

    for (const viz of this.visualizations) {
      if (!viz.enabled || viz.type !== 'line-chart') continue;

      // Create LineChartRenderer
      const chartRenderer = new LineChartRenderer(this.env, {
        width: 400,
        height: 200,
        autoScale: viz.options.autoScale,
        autoScroll: viz.options.autoScroll,
        range: viz.options.range ?? { min: 0, max: 100 },
        background: '#ffffff',
      });

      // Add metrics for each series
      for (const series of viz.series) {
        const metricFn = this.createMetricFunction(series.metric);
        if (metricFn) {
          // Use a custom key that encodes the metric config
          const metricKey = this.getMetricKey(series.metric);
          chartRenderer.metric(metricKey, {
            color: series.color,
            fn: metricFn,
          });
        }
      }

      this.chartRenderers.set(viz.id, chartRenderer);
    }
  }

  /**
   * Render all chart visualizations
   */
  private renderCharts(): void {
    for (const renderer of this.chartRenderers.values()) {
      renderer.render();
    }
  }

  /**
   * Create a metric function for a series based on its configuration
   */
  private createMetricFunction(metric: import('@/types').MetricConfig): ((arr: number[]) => number) | null {
    if (!this.env) return null;

    const agentTypeId = metric.agentTypeId;

    if (metric.type === 'count') {
      // Count agents of the specified type
      return () => {
        if (!this.env) return 0;
        return this.env.getAgents().filter(a => a.get('typeId') === agentTypeId).length;
      };
    }

    if (metric.type === 'property') {
      const { property, aggregation } = metric;
      
      // Get values for agents of the specified type
      const getValues = (): number[] => {
        if (!this.env) return [];
        return this.env.getAgents()
          .filter(a => a.get('typeId') === agentTypeId)
          .map(a => a.get(property) as number)
          .filter(v => v !== null && v !== undefined && typeof v === 'number');
      };

      switch (aggregation) {
        case 'mean':
          return () => {
            const values = getValues();
            if (values.length === 0) return 0;
            return values.reduce((sum, v) => sum + v, 0) / values.length;
          };
        case 'min':
          return () => {
            const values = getValues();
            if (values.length === 0) return 0;
            return Math.min(...values);
          };
        case 'max':
          return () => {
            const values = getValues();
            if (values.length === 0) return 0;
            return Math.max(...values);
          };
        case 'sum':
          return () => {
            const values = getValues();
            return values.reduce((sum, v) => sum + v, 0);
          };
        case 'median':
          return () => {
            const values = getValues().sort((a, b) => a - b);
            if (values.length === 0) return 0;
            const mid = Math.floor(values.length / 2);
            return values.length % 2 === 0
              ? (values[mid - 1] + values[mid]) / 2
              : values[mid];
          };
        default:
          return null;
      }
    }

    return null;
  }

  /**
   * Generate a unique key for a metric configuration
   * This is used internally by LineChartRenderer
   */
  private getMetricKey(metric: import('@/types').MetricConfig): string {
    if (metric.type === 'count') {
      return `count:${metric.agentTypeId}`;
    }
    return `${metric.aggregation}:${metric.agentTypeId}:${metric.property}`;
  }
}
