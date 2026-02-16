/**
 * Model Compiler
 * 
 * Compiles a StudioModel definition into executable Flocc code.
 * Generates a self-contained script that can run in a Web Worker.
 */

import type { StudioModel, AgentType, Behavior } from '@/types';

// ============================================================================
// Compilation
// ============================================================================

/**
 * Compile a StudioModel to a JavaScript module string
 * that can be executed in a Web Worker
 */
export function compileModel(model: StudioModel): string {
  const lines: string[] = [];

  // Import Flocc (will be available in worker context)
  lines.push(`// Compiled from: ${model.name}`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Environment setup
  lines.push('// Environment');
  lines.push(`const ENV_WIDTH = ${model.environment.width};`);
  lines.push(`const ENV_HEIGHT = ${model.environment.height};`);
  lines.push(`const WRAPAROUND = ${model.environment.wraparound};`);
  lines.push('');

  // Agent type map for lookups
  lines.push('// Agent type metadata');
  lines.push('const AGENT_TYPES = new Map([');
  for (const agentType of model.agentTypes) {
    lines.push(`  ['${agentType.id}', ${JSON.stringify({
      id: agentType.id,
      name: agentType.name,
      color: agentType.color,
      shape: agentType.shape,
      size: agentType.size,
    })}],`);
  }
  lines.push(']);');
  lines.push('');

  // Compile behavior functions for each agent type
  lines.push('// Behavior functions');
  for (const agentType of model.agentTypes) {
    lines.push(compileBehaviorFunction(agentType, model));
    lines.push('');
  }

  // Setup function
  lines.push('// Setup function - creates environment and agents');
  lines.push('function setup(env) {');
  
  // Create agents for each population
  for (const pop of model.populations) {
    const agentType = model.agentTypes.find((t) => t.id === pop.agentTypeId);
    if (!agentType) continue;

    lines.push(`  // Population: ${agentType.name} (${pop.count} agents)`);
    lines.push(`  for (let i = 0; i < ${pop.count}; i++) {`);
    lines.push(`    const agent = new Agent();`);
    lines.push(`    agent.set('typeId', '${agentType.id}');`);
    lines.push(`    agent.set('x', Math.random() * ENV_WIDTH);`);
    lines.push(`    agent.set('y', Math.random() * ENV_HEIGHT);`);
    lines.push(`    agent.addRule(tick_${sanitizeId(agentType.id)});`);
    lines.push(`    env.addAgent(agent);`);
    lines.push(`  }`);
  }
  
  lines.push('}');
  lines.push('');

  // Wraparound helper
  if (model.environment.wraparound) {
    lines.push('// Wraparound helper');
    lines.push('function wrap(agent) {');
    lines.push('  let x = agent.get("x");');
    lines.push('  let y = agent.get("y");');
    lines.push('  if (x < 0) x += ENV_WIDTH;');
    lines.push('  if (x >= ENV_WIDTH) x -= ENV_WIDTH;');
    lines.push('  if (y < 0) y += ENV_HEIGHT;');
    lines.push('  if (y >= ENV_HEIGHT) y -= ENV_HEIGHT;');
    lines.push('  agent.set("x", x);');
    lines.push('  agent.set("y", y);');
    lines.push('}');
    lines.push('');
  }

  // Export for worker
  lines.push('// Exports');
  lines.push('self.modelSetup = setup;');
  lines.push('self.AGENT_TYPES = AGENT_TYPES;');
  lines.push('self.ENV_WIDTH = ENV_WIDTH;');
  lines.push('self.ENV_HEIGHT = ENV_HEIGHT;');

  return lines.join('\n');
}

/**
 * Compile behaviors for an agent type into a tick function
 */
function compileBehaviorFunction(agentType: AgentType, model: StudioModel): string {
  const fnName = `tick_${sanitizeId(agentType.id)}`;
  const lines: string[] = [];
  
  lines.push(`function ${fnName}(agent) {`);
  
  // Get current position
  lines.push('  const x = agent.get("x");');
  lines.push('  const y = agent.get("y");');
  lines.push('  let dx = 0;');
  lines.push('  let dy = 0;');
  lines.push('');

  // Compile each enabled behavior
  const enabledBehaviors = agentType.behaviors.filter((b) => b.enabled);
  
  for (const behavior of enabledBehaviors) {
    lines.push(`  // Behavior: ${behavior.type}`);
    lines.push(compileBehavior(behavior, model));
    lines.push('');
  }

  // Apply movement
  lines.push('  // Apply movement');
  lines.push('  agent.set("x", x + dx);');
  lines.push('  agent.set("y", y + dy);');
  
  // Wraparound if enabled
  if (model.environment.wraparound) {
    lines.push('  wrap(agent);');
  }
  
  lines.push('}');
  
  return lines.join('\n');
}

/**
 * Compile a single behavior to JavaScript code
 */
function compileBehavior(behavior: Behavior, model: StudioModel): string {
  const { type, params } = behavior;
  
  switch (type) {
    case 'random-walk': {
      const speed = params.speed ?? 2;
      return `  {
    const angle = Math.random() * Math.PI * 2;
    dx += Math.cos(angle) * ${speed};
    dy += Math.sin(angle) * ${speed};
  }`;
    }
    
    case 'move-toward': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return '  // move-toward: no target specified';
      
      return `  {
    // Find nearest agent of target type
    const env = agent.environment;
    let nearest = null;
    let nearestDist = Infinity;
    for (const other of env.getAgents()) {
      if (other === agent) continue;
      if (other.get('typeId') !== '${targetTypeId}') continue;
      const ox = other.get('x');
      const oy = other.get('y');
      const dist = Math.sqrt((ox - x) ** 2 + (oy - y) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }
    if (nearest && nearestDist > 0) {
      const ox = nearest.get('x');
      const oy = nearest.get('y');
      const angle = Math.atan2(oy - y, ox - x);
      dx += Math.cos(angle) * ${speed};
      dy += Math.sin(angle) * ${speed};
    }
  }`;
    }
    
    case 'move-away': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return '  // move-away: no target specified';
      
      return `  {
    // Find nearest agent of target type and flee
    const env = agent.environment;
    let nearest = null;
    let nearestDist = Infinity;
    for (const other of env.getAgents()) {
      if (other === agent) continue;
      if (other.get('typeId') !== '${targetTypeId}') continue;
      const ox = other.get('x');
      const oy = other.get('y');
      const dist = Math.sqrt((ox - x) ** 2 + (oy - y) ** 2);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = other;
      }
    }
    if (nearest && nearestDist > 0) {
      const ox = nearest.get('x');
      const oy = nearest.get('y');
      const angle = Math.atan2(oy - y, ox - x);
      // Move in opposite direction
      dx += Math.cos(angle + Math.PI) * ${speed};
      dy += Math.sin(angle + Math.PI) * ${speed};
    }
  }`;
    }
    
    default:
      return `  // Unknown behavior type: ${type}`;
  }
}

/**
 * Sanitize an ID to be a valid JavaScript identifier
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}
