/**
 * Model Compiler
 * 
 * Compiles a StudioModel definition into Flocc Rules.
 * Uses the Rule DSL for simple behaviors and helper functions for complex ones.
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

  // Environment constants
  lines.push('// Environment');
  lines.push(`const ENV_WIDTH = ${model.environment.width};`);
  lines.push(`const ENV_HEIGHT = ${model.environment.height};`);
  lines.push(`const WRAPAROUND = ${model.environment.wraparound};`);
  lines.push('');

  // Seed random for reproducibility
  lines.push('// Seed random for reproducibility');
  lines.push('utils.seed(12345);');
  lines.push('');

  // Agent type metadata
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

  // Helper functions
  lines.push('// Helper: find nearest agent of a type');
  lines.push(`function findNearest(agent, typeId) {
  const env = agent.environment;
  const x = agent.get('x');
  const y = agent.get('y');
  let nearest = null;
  let nearestDist = Infinity;
  for (const other of env.getAgents()) {
    if (other === agent) continue;
    if (other.get('typeId') !== typeId) continue;
    const ox = other.get('x');
    const oy = other.get('y');
    const dist = Math.sqrt((ox - x) ** 2 + (oy - y) ** 2);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = other;
    }
  }
  return nearest;
}`);
  lines.push('');

  // Compile tick function for each agent type
  lines.push('// Agent tick functions');
  for (const agentType of model.agentTypes) {
    lines.push(compileAgentTickFunction(agentType, model));
    lines.push('');
  }

  // Setup function
  lines.push('// Setup function');
  lines.push('function setup(env) {');
  
  for (const pop of model.populations) {
    const agentType = model.agentTypes.find((t) => t.id === pop.agentTypeId);
    if (!agentType) continue;
    const tickFn = `tick_${sanitizeId(agentType.id)}`;

    lines.push(`  // ${agentType.name}: ${pop.count} agents`);
    lines.push(`  for (let i = 0; i < ${pop.count}; i++) {`);
    lines.push(`    const agent = new Agent();`);
    lines.push(`    agent.set('typeId', '${agentType.id}');`);
    lines.push(`    agent.set('x', utils.random(0, ENV_WIDTH - 1, true));`);
    lines.push(`    agent.set('y', utils.random(0, ENV_HEIGHT - 1, true));`);
    lines.push(`    agent.set('tick', ${tickFn});`);
    lines.push(`    env.addAgent(agent);`);
    lines.push(`  }`);
  }
  
  lines.push('}');
  lines.push('');

  // Exports
  lines.push('// Exports');
  lines.push('self.modelSetup = setup;');
  lines.push('self.AGENT_TYPES = AGENT_TYPES;');
  lines.push('self.ENV_WIDTH = ENV_WIDTH;');
  lines.push('self.ENV_HEIGHT = ENV_HEIGHT;');

  return lines.join('\n');
}

/**
 * Compile tick function for an agent type
 * Uses Rule DSL where practical, helper functions for complex operations
 */
function compileAgentTickFunction(agentType: AgentType, model: StudioModel): string {
  const fnName = `tick_${sanitizeId(agentType.id)}`;
  const enabledBehaviors = agentType.behaviors.filter((b) => b.enabled);
  const hasBounce = enabledBehaviors.some(b => b.type === 'bounce');
  
  // Build Rule DSL steps for simple behaviors
  const ruleSteps: any[] = [];
  
  // JS code for complex behaviors
  const jsCode: string[] = [];
  
  for (const behavior of enabledBehaviors) {
    if (behavior.type === 'bounce') continue;
    
    const result = compileBehavior(behavior, model, agentType.id);
    if (result.rule) {
      ruleSteps.push(...result.rule);
    }
    if (result.js) {
      jsCode.push(result.js);
    }
  }
  
  // Add boundary handling
  if (hasBounce) {
    jsCode.push(compileBounceJS());
  } else if (model.environment.wraparound) {
    ruleSteps.push(...compileWraparoundRuleSteps(model));
  }
  
  // Generate the function
  const lines: string[] = [];
  
  if (ruleSteps.length > 0 && jsCode.length === 0) {
    // Pure Rule DSL
    lines.push(`const ${fnName} = new Rule(null, ${JSON.stringify(ruleSteps, null, 2)});`);
  } else if (ruleSteps.length === 0 && jsCode.length > 0) {
    // Pure JS
    lines.push(`function ${fnName}(agent) {`);
    lines.push(`  const env = agent.environment;`);
    lines.push(`  const x = agent.get('x');`);
    lines.push(`  const y = agent.get('y');`);
    for (const code of jsCode) {
      lines.push(code);
    }
    lines.push(`}`);
  } else {
    // Hybrid: wrap Rule in a function that also runs JS
    lines.push(`const ${fnName}_rule = new Rule(null, ${JSON.stringify(ruleSteps, null, 2)});`);
    lines.push(`function ${fnName}(agent) {`);
    lines.push(`  const env = agent.environment;`);
    lines.push(`  ${fnName}_rule.environment = env;`);
    lines.push(`  const x = agent.get('x');`);
    lines.push(`  const y = agent.get('y');`);
    for (const code of jsCode) {
      lines.push(code);
    }
    lines.push(`  ${fnName}_rule.call(agent);`);
    lines.push(`}`);
  }
  
  return lines.join('\n');
}

interface BehaviorCompilation {
  rule?: any[];
  js?: string;
}

/**
 * Compile a behavior - returns Rule steps and/or JS code
 */
function compileBehavior(behavior: Behavior, model: StudioModel, agentTypeId: string): BehaviorCompilation {
  const { type, params } = behavior;
  
  switch (type) {
    case 'random-walk': {
      const speed = params.speed ?? 2;
      // Pure Rule DSL with random operator
      return {
        rule: [
          ["local", "_angle", ["multiply", ["random"], 6.283185307179586]],
          ["set", "x", ["add", ["get", "x"], 
            ["multiply", ["method", "Math", "cos", ["local", "_angle"]], speed]]],
          ["set", "y", ["add", ["get", "y"], 
            ["multiply", ["method", "Math", "sin", ["local", "_angle"]], speed]]]
        ]
      };
    }
    
    case 'move-toward': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return {};
      
      // Use JS helper for finding nearest
      return {
        js: `  // Move toward ${targetTypeId}
  {
    const target = findNearest(agent, '${targetTypeId}');
    if (target) {
      const tx = target.get('x');
      const ty = target.get('y');
      const dx = tx - x;
      const dy = ty - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        agent.set('x', x + (dx / dist) * ${speed});
        agent.set('y', y + (dy / dist) * ${speed});
      }
    }
  }`
      };
    }
    
    case 'move-away': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return {};
      
      return {
        js: `  // Move away from ${targetTypeId}
  {
    const target = findNearest(agent, '${targetTypeId}');
    if (target) {
      const tx = target.get('x');
      const ty = target.get('y');
      const dx = tx - x;
      const dy = ty - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        agent.set('x', x - (dx / dist) * ${speed});
        agent.set('y', y - (dy / dist) * ${speed});
      }
    }
  }`
      };
    }
    
    case 'wiggle': {
      const maxAngle = params.angle ?? 30;
      const maxRad = maxAngle * Math.PI / 180;
      // Rule DSL: add random angle variance
      return {
        rule: [
          ["local", "_wiggle", ["subtract", ["multiply", ["random"], maxRad * 2], maxRad]],
          ["local", "_heading", ["add", ["get", "heading"], ["multiply", ["local", "_wiggle"], 57.29577951]]],
          ["set", "heading", ["local", "_heading"]]
        ]
      };
    }
    
    case 'die': {
      const probability = params.probability ?? 0.01;
      // Rule DSL with random
      return {
        rule: [
          ["if", ["lt", ["random"], probability],
            ["method", ["environment"], "removeAgent", ["agent"]]]
        ]
      };
    }
    
    case 'reproduce': {
      const probability = params.probability ?? 0.01;
      const tickFn = `tick_${sanitizeId(agentTypeId)}`;
      // Needs JS to create new agent
      return {
        js: `  // Reproduce
  if (utils.random(0, 1, true) < ${probability}) {
    const child = new Agent();
    child.set('typeId', '${agentTypeId}');
    child.set('x', x + utils.random(-5, 5, true));
    child.set('y', y + utils.random(-5, 5, true));
    child.set('tick', ${tickFn});
    env.addAgent(child);
  }`
      };
    }
    
    default:
      return {};
  }
}

/**
 * Wraparound as Rule DSL steps
 */
function compileWraparoundRuleSteps(model: StudioModel): any[] {
  const w = model.environment.width;
  const h = model.environment.height;
  
  return [
    ["if", ["lt", ["get", "x"], 0],
      ["set", "x", ["add", ["get", "x"], w]]],
    ["if", ["gte", ["get", "x"], w],
      ["set", "x", ["subtract", ["get", "x"], w]]],
    ["if", ["lt", ["get", "y"], 0],
      ["set", "y", ["add", ["get", "y"], h]]],
    ["if", ["gte", ["get", "y"], h],
      ["set", "y", ["subtract", ["get", "y"], h]]]
  ];
}

/**
 * Bounce as JS (complex conditional logic)
 */
function compileBounceJS(): string {
  return `  // Bounce off edges
  {
    let nx = agent.get('x');
    let ny = agent.get('y');
    if (nx < 0 || nx >= ENV_WIDTH) {
      nx = Math.max(0, Math.min(ENV_WIDTH - 1, nx));
      agent.set('x', nx);
    }
    if (ny < 0 || ny >= ENV_HEIGHT) {
      ny = Math.max(0, Math.min(ENV_HEIGHT - 1, ny));
      agent.set('y', ny);
    }
  }`;
}

/**
 * Sanitize an ID to be a valid JavaScript identifier
 */
function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}
