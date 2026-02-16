/**
 * Model Compiler
 * 
 * Compiles a StudioModel definition into executable Flocc code.
 * Generates a self-contained script that can run in a Web Worker.
 * 
 * Uses Flocc's seeded random for reproducibility.
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

  lines.push(`// Compiled from: ${model.name}`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Environment setup
  lines.push('// Environment');
  lines.push(`const ENV_WIDTH = ${model.environment.width};`);
  lines.push(`const ENV_HEIGHT = ${model.environment.height};`);
  lines.push(`const WRAPAROUND = ${model.environment.wraparound};`);
  lines.push('');

  // Seed random for reproducibility
  lines.push('// Seed random for reproducibility');
  lines.push('utils.seed(12345);');
  lines.push('');

  // Helper: random using Flocc's seeded random
  lines.push('// Random helper using Flocc\'s seeded PRNG');
  lines.push('const random = utils.random;');
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
    lines.push(`    agent.set('x', random(0, ENV_WIDTH, true));`);
    lines.push(`    agent.set('y', random(0, ENV_HEIGHT, true));`);
    lines.push(`    agent.set('heading', random(0, 360, true));`);  // Direction in degrees
    lines.push(`    agent.addRule(tick_${sanitizeId(agentType.id)});`);
    lines.push(`    env.addAgent(agent);`);
    lines.push(`  }`);
  }
  
  lines.push('}');
  lines.push('');

  // Helper functions
  lines.push('// Helper functions');
  
  // Wraparound
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

  // Bounce
  lines.push('function bounce(agent) {');
  lines.push('  let x = agent.get("x");');
  lines.push('  let y = agent.get("y");');
  lines.push('  let heading = agent.get("heading");');
  lines.push('  let bounced = false;');
  lines.push('  if (x < 0 || x >= ENV_WIDTH) {');
  lines.push('    heading = 180 - heading;');
  lines.push('    bounced = true;');
  lines.push('  }');
  lines.push('  if (y < 0 || y >= ENV_HEIGHT) {');
  lines.push('    heading = -heading;');
  lines.push('    bounced = true;');
  lines.push('  }');
  lines.push('  if (bounced) {');
  lines.push('    agent.set("heading", heading);');
  lines.push('    agent.set("x", Math.max(0, Math.min(ENV_WIDTH - 1, x)));');
  lines.push('    agent.set("y", Math.max(0, Math.min(ENV_HEIGHT - 1, y)));');
  lines.push('  }');
  lines.push('}');
  lines.push('');

  // Find nearest agent of type
  lines.push('function findNearest(agent, env, typeId) {');
  lines.push('  const x = agent.get("x");');
  lines.push('  const y = agent.get("y");');
  lines.push('  let nearest = null;');
  lines.push('  let nearestDist = Infinity;');
  lines.push('  for (const other of env.getAgents()) {');
  lines.push('    if (other === agent) continue;');
  lines.push('    if (other.get("typeId") !== typeId) continue;');
  lines.push('    const ox = other.get("x");');
  lines.push('    const oy = other.get("y");');
  lines.push('    const dist = Math.sqrt((ox - x) ** 2 + (oy - y) ** 2);');
  lines.push('    if (dist < nearestDist) {');
  lines.push('      nearestDist = dist;');
  lines.push('      nearest = other;');
  lines.push('    }');
  lines.push('  }');
  lines.push('  return { agent: nearest, distance: nearestDist };');
  lines.push('}');
  lines.push('');

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
  lines.push('  const env = agent.environment;');
  lines.push('  const x = agent.get("x");');
  lines.push('  const y = agent.get("y");');
  lines.push('  let heading = agent.get("heading") || 0;');
  lines.push('  let dx = 0;');
  lines.push('  let dy = 0;');
  lines.push('');

  // Track if we need bounce or wrap at the end
  let hasBounce = false;
  let hasMovement = false;

  // Compile each enabled behavior
  const enabledBehaviors = agentType.behaviors.filter((b) => b.enabled);
  
  for (const behavior of enabledBehaviors) {
    if (behavior.type === 'bounce') {
      hasBounce = true;
      continue; // Handle at end
    }
    
    const code = compileBehavior(behavior, model);
    if (code) {
      lines.push(`  // ${behavior.type}`);
      lines.push(code);
      lines.push('');
      
      if (['random-walk', 'move-toward', 'move-away', 'wiggle'].includes(behavior.type)) {
        hasMovement = true;
      }
    }
  }

  // Apply movement if any movement behaviors exist
  if (hasMovement) {
    lines.push('  // Apply movement');
    lines.push('  agent.set("x", x + dx);');
    lines.push('  agent.set("y", y + dy);');
    lines.push('  agent.set("heading", heading);');
    lines.push('');
  }
  
  // Handle boundary behavior
  if (hasBounce) {
    lines.push('  // Bounce off edges');
    lines.push('  bounce(agent);');
  } else if (model.environment.wraparound) {
    lines.push('  // Wrap around edges');
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
    const angle = random(0, 360, true) * Math.PI / 180;
    dx += Math.cos(angle) * ${speed};
    dy += Math.sin(angle) * ${speed};
    heading = angle * 180 / Math.PI;
  }`;
    }
    
    case 'move-toward': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return '  // move-toward: no target specified';
      
      return `  {
    const result = findNearest(agent, env, '${targetTypeId}');
    if (result.agent && result.distance > 0) {
      const ox = result.agent.get('x');
      const oy = result.agent.get('y');
      const angle = Math.atan2(oy - y, ox - x);
      dx += Math.cos(angle) * ${speed};
      dy += Math.sin(angle) * ${speed};
      heading = angle * 180 / Math.PI;
    }
  }`;
    }
    
    case 'move-away': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return '  // move-away: no target specified';
      
      return `  {
    const result = findNearest(agent, env, '${targetTypeId}');
    if (result.agent && result.distance > 0) {
      const ox = result.agent.get('x');
      const oy = result.agent.get('y');
      const angle = Math.atan2(oy - y, ox - x) + Math.PI;
      dx += Math.cos(angle) * ${speed};
      dy += Math.sin(angle) * ${speed};
      heading = angle * 180 / Math.PI;
    }
  }`;
    }
    
    case 'wiggle': {
      const maxAngle = params.angle ?? 30;
      return `  {
    const wiggle = (random(0, ${maxAngle * 2}, true) - ${maxAngle}) * Math.PI / 180;
    const newHeading = (heading * Math.PI / 180) + wiggle;
    heading = newHeading * 180 / Math.PI;
  }`;
    }
    
    case 'die': {
      const probability = params.probability ?? 0.01;
      return `  {
    if (random(0, 1, true) < ${probability}) {
      env.removeAgent(agent);
      return;
    }
  }`;
    }
    
    case 'reproduce': {
      const probability = params.probability ?? 0.01;
      // Note: We need to pass the agent type ID through context
      // For now, get it from the model by finding which agent type has this behavior
      const agentTypeId = model.agentTypes.find(t => 
        t.behaviors.some(b => b.id === behavior.id)
      )?.id || '';
      const tickFnName = `tick_${sanitizeId(agentTypeId)}`;
      
      return `  {
    if (random(0, 1, true) < ${probability}) {
      const child = new Agent();
      child.set('typeId', agent.get('typeId'));
      child.set('x', x + random(-5, 5, true));
      child.set('y', y + random(-5, 5, true));
      child.set('heading', random(0, 360, true));
      child.addRule(${tickFnName});
      env.addAgent(child);
    }
  }`;
    }
    
    case 'bounce':
      // Handled at the end of tick function
      return '';
    
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
