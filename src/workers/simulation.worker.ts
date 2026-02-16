/**
 * Simulation Web Worker
 * 
 * Runs Flocc simulations in a separate thread to keep UI responsive.
 * Receives compiled model code, executes it, and sends state updates.
 */

import { Environment, Agent } from 'flocc';

// ============================================================================
// Types
// ============================================================================

interface InitMessage {
  type: 'init';
  modelCode: string;
}

interface ControlMessage {
  type: 'play' | 'pause' | 'step' | 'reset' | 'set-speed';
  ticksPerFrame?: number;
}

type WorkerMessage = InitMessage | ControlMessage;

interface AgentSnapshot {
  id: string;
  typeId: string;
  x: number;
  y: number;
}

interface StateMessage {
  type: 'state';
  tick: number;
  agents: AgentSnapshot[];
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

// ============================================================================
// Worker State
// ============================================================================

let env: Environment | null = null;
let isRunning = false;
let tickCount = 0;
let ticksPerFrame = 1;
let animationId: number | null = null;

// Agent ID counter
let agentIdCounter = 0;

// ============================================================================
// Message Handlers
// ============================================================================

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;

  switch (message.type) {
    case 'init':
      initialize(message.modelCode);
      break;
    case 'play':
      play();
      break;
    case 'pause':
      pause();
      break;
    case 'step':
      step();
      break;
    case 'reset':
      reset();
      break;
    case 'set-speed':
      ticksPerFrame = message.ticksPerFrame ?? 1;
      break;
  }
};

// ============================================================================
// Core Functions
// ============================================================================

function initialize(modelCode: string) {
  try {
    // Reset state
    pause();
    tickCount = 0;
    agentIdCounter = 0;

    // Create new environment
    env = new Environment();

    // Make Agent available in the eval context
    (self as any).Agent = Agent;
    (self as any).Environment = Environment;

    // Execute the compiled model code
    // This sets up self.modelSetup, self.AGENT_TYPES, etc.
    eval(modelCode);

    // Call the setup function to create agents
    const setupFn = (self as any).modelSetup;
    if (typeof setupFn === 'function') {
      setupFn(env);
    }

    // Assign IDs to agents
    for (const agent of env.getAgents()) {
      agent.set('_id', `agent_${agentIdCounter++}`);
    }

    // Send initial state
    sendState();
  } catch (error: any) {
    const errorMsg: ErrorMessage = {
      type: 'error',
      message: error.message || 'Failed to initialize model',
    };
    self.postMessage(errorMsg);
  }
}

function play() {
  if (!env || isRunning) return;
  isRunning = true;
  runLoop();
}

function pause() {
  isRunning = false;
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function step() {
  if (!env) return;
  pause();
  tick();
  sendState();
}

function reset() {
  // Re-initialize from the last model code
  const modelSetup = (self as any).modelSetup;
  if (!modelSetup || !env) return;

  pause();
  tickCount = 0;
  agentIdCounter = 0;

  // Clear existing agents
  const agents = [...env.getAgents()];
  for (const agent of agents) {
    env.removeAgent(agent);
  }

  // Re-run setup
  modelSetup(env);

  // Assign IDs
  for (const agent of env.getAgents()) {
    agent.set('_id', `agent_${agentIdCounter++}`);
  }

  sendState();
}

// ============================================================================
// Simulation Loop
// ============================================================================

function runLoop() {
  if (!isRunning || !env) return;

  // Run multiple ticks per frame based on speed
  for (let i = 0; i < ticksPerFrame; i++) {
    tick();
  }

  sendState();

  // Schedule next frame
  animationId = requestAnimationFrame(runLoop);
}

function tick() {
  if (!env) return;
  env.tick();
  tickCount++;
}

function sendState() {
  if (!env) return;

  const agents: AgentSnapshot[] = env.getAgents().map((agent) => ({
    id: agent.get('_id') as string,
    typeId: agent.get('typeId') as string,
    x: agent.get('x') as number,
    y: agent.get('y') as number,
  }));

  const stateMsg: StateMessage = {
    type: 'state',
    tick: tickCount,
    agents,
  };

  self.postMessage(stateMsg);
}
