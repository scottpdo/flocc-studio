/**
 * Model Compiler
 * 
 * Compiles a StudioModel definition into executable simulation code.
 * Generates a setup function and metadata for the SimulationEngine.
 */

import { Environment, Agent, utils } from 'flocc';
import type { StudioModel, AgentType, Behavior } from '@/types';
import type { AgentTypeMetadata } from './SimulationEngine';

// ============================================================================
// Compilation Result
// ============================================================================

export interface CompiledModel {
  setup: (env: Environment) => void;
  agentTypes: Map<string, AgentTypeMetadata>;
  envConfig: {
    width: number;
    height: number;
    wraparound: boolean;
    backgroundColor?: string;
  };
}

// ============================================================================
// Main Compilation Function
// ============================================================================

/**
 * Compile a StudioModel to executable simulation code
 */
export function compileModel(model: StudioModel): CompiledModel {
  // Build agent type metadata
  const agentTypes = new Map<string, AgentTypeMetadata>();
  for (const agentType of model.agentTypes) {
    agentTypes.set(agentType.id, {
      id: agentType.id,
      name: agentType.name,
      color: agentType.color,
      shape: agentType.shape,
      size: agentType.size,
    });
  }

  // Build tick functions for each agent type
  const tickFunctions = new Map<string, (agent: Agent) => void>();
  for (const agentType of model.agentTypes) {
    tickFunctions.set(agentType.id, compileAgentTickFunction(agentType, model));
  }

  // Environment config
  const envConfig = {
    width: model.environment.width,
    height: model.environment.height,
    wraparound: model.environment.wraparound,
    backgroundColor: model.environment.backgroundColor,
  };

  // Setup function
  const setup = (env: Environment) => {
    // Seed random for reproducibility
    utils.seed(12345);

    for (const pop of model.populations) {
      const agentType = model.agentTypes.find((t) => t.id === pop.agentTypeId);
      if (!agentType) continue;

      const tickFn = tickFunctions.get(agentType.id);

      for (let i = 0; i < pop.count; i++) {
        const agent = new Agent();
        agent.set('typeId', agentType.id);
        agent.set('x', utils.random(0, envConfig.width - 1, true));
        agent.set('y', utils.random(0, envConfig.height - 1, true));
        
        // Initialize custom properties
        for (const prop of agentType.properties) {
          agent.set(prop.name, prop.defaultValue);
        }
        
        // Initialize velocity for movement behaviors
        const hasMoveForward = agentType.behaviors.some(b => b.type === 'move-forward' && b.enabled);
        const hasFlocking = agentType.behaviors.some(b => 
          ['separate', 'align', 'cohere'].includes(b.type) && b.enabled
        );
        
        if (hasMoveForward || hasFlocking) {
          // Random initial velocity
          const angle = utils.random(0, Math.PI * 2, true);
          const speedParam = agentType.behaviors.find(b => b.type === 'move-forward')?.params.speed ?? 2;
          // Resolve parameter reference (e.g. "$speed" -> env.get("speed"))
          let speed: number;
          if (typeof speedParam === 'string' && speedParam.startsWith('$')) {
            const paramName = speedParam.slice(1);
            speed = (env.get(paramName) as number) ?? 2;
          } else {
            speed = speedParam as number;
          }
          agent.set('vx', Math.cos(angle) * speed);
          agent.set('vy', Math.sin(angle) * speed);
        }

        if (tickFn) {
          agent.set('tick', tickFn);
        }

        env.addAgent(agent);
      }
    }
  };

  return { setup, agentTypes, envConfig };
}

// ============================================================================
// Agent Tick Function Compilation
// ============================================================================

/**
 * Compile tick function for an agent type
 */
function compileAgentTickFunction(agentType: AgentType, model: StudioModel): (agent: Agent) => void {
  const enabledBehaviors = agentType.behaviors.filter((b) => b.enabled);
  
  if (enabledBehaviors.length === 0) {
    return () => {}; // No-op if no behaviors
  }

  // Compile each behavior to a function
  const behaviorFns = enabledBehaviors.map((behavior) => 
    compileBehavior(behavior, model, agentType.id)
  ).filter((fn): fn is (agent: Agent) => void => fn !== null);

  // Combined tick function
  return (agent: Agent) => {
    for (const fn of behaviorFns) {
      fn(agent);
    }
  };
}

/**
 * Compile a single behavior to a function
 */
function compileBehavior(
  behavior: Behavior, 
  model: StudioModel, 
  agentTypeId: string
): ((agent: Agent) => void) | null {
  const { type, params } = behavior;
  const envWidth = model.environment.width;
  const envHeight = model.environment.height;
  const wraparound = model.environment.wraparound;

  switch (type) {
    case 'random-walk': {
      const speedParam = params.speed;
      return (agent: Agent) => {
        const speed = resolveParam(speedParam, agent, 2);
        const angle = utils.random(0, Math.PI * 2, true);
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        let nx = x + Math.cos(angle) * speed;
        let ny = y + Math.sin(angle) * speed;
        
        if (wraparound) {
          nx = ((nx % envWidth) + envWidth) % envWidth;
          ny = ((ny % envHeight) + envHeight) % envHeight;
        }
        
        agent.set('x', nx);
        agent.set('y', ny);
      };
    }

    case 'move-forward': {
      const speedParam = params.speed;
      return (agent: Agent) => {
        const speed = resolveParam(speedParam, agent, 2);
        let vx = agent.get('vx') as number ?? 0;
        let vy = agent.get('vy') as number ?? 0;
        
        // Normalize and apply speed
        const mag = Math.sqrt(vx * vx + vy * vy);
        if (mag > 0) {
          vx = (vx / mag) * speed;
          vy = (vy / mag) * speed;
          agent.set('vx', vx);
          agent.set('vy', vy);
        }
        
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        let nx = x + vx;
        let ny = y + vy;
        
        if (wraparound) {
          nx = ((nx % envWidth) + envWidth) % envWidth;
          ny = ((ny % envHeight) + envHeight) % envHeight;
        }
        
        agent.set('x', nx);
        agent.set('y', ny);
      };
    }

    case 'move-toward': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return null;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const target = findNearest(agent, targetTypeId);
        
        if (target) {
          const tx = target.get('x') as number;
          const ty = target.get('y') as number;
          const [dx, dy] = getDirection(x, y, tx, ty, envWidth, envHeight, wraparound);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            agent.set('x', x + (dx / dist) * speed);
            agent.set('y', y + (dy / dist) * speed);
          }
        }
      };
    }

    case 'move-away': {
      const speed = params.speed ?? 2;
      const targetTypeId = params.target;
      if (!targetTypeId) return null;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const target = findNearest(agent, targetTypeId);
        
        if (target) {
          const tx = target.get('x') as number;
          const ty = target.get('y') as number;
          const [dx, dy] = getDirection(x, y, tx, ty, envWidth, envHeight, wraparound);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            agent.set('x', x - (dx / dist) * speed);
            agent.set('y', y - (dy / dist) * speed);
          }
        }
      };
    }

    case 'separate': {
      const radiusParam = params.radius;
      const strengthParam = params.strength;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        // Resolve parameters at runtime (supports "$paramName" references)
        const radius = resolveParam(radiusParam, agent, 25);
        const strength = resolveParam(strengthParam, agent, 1);
        
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const typeId = agent.get('typeId') as string;
        
        let steerX = 0;
        let steerY = 0;
        
        const others = env.helpers.kdtree.agentsWithinDistance(agent, radius, (a) => a.get('typeId') === typeId);
        if (others.length === 0) {
          return;
        }

        for (const other of others) {
          const ox = other.get('x') as number;
          const oy = other.get('y') as number;
          const [dx, dy] = getDirection(x, y, ox, oy, envWidth, envHeight, wraparound);
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist > 0) {
            // Weight by inverse distance (closer = stronger repulsion)
            steerX -= (dx / dist) / dist;
            steerY -= (dy / dist) / dist;
          }
        }
        
        const vx = (agent.get('vx') as number) ?? 0;
        const vy = (agent.get('vy') as number) ?? 0;
        agent.set('vx', vx + steerX * strength);
        agent.set('vy', vy + steerY * strength);
      };
    }

    case 'align': {
      const radiusParam = params.radius;
      const strengthParam = params.strength;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        // Resolve parameters at runtime
        const radius = resolveParam(radiusParam, agent, 50);
        const strength = resolveParam(strengthParam, agent, 1);
        
        const typeId = agent.get('typeId') as string;

        const neighbors = env.helpers.kdtree.agentsWithinDistance(agent, radius, (a) => a.get('typeId') === typeId);
        const count = neighbors.length;
        
        if (count > 0) {
          const avgVx = utils.mean(neighbors.map((n) => n.get('vx')));
          const avgVy = utils.mean(neighbors.map((n) => n.get('vy')));
          const vx = (agent.get('vx') as number) ?? 0;
          const vy = (agent.get('vy') as number) ?? 0;
          
          // Steer toward average velocity
          agent.set('vx', vx + (avgVx - vx) * strength * 0.1);
          agent.set('vy', vy + (avgVy - vy) * strength * 0.1);
        }
      };
    }

    case 'cohere': {
      const radiusParam = params.radius;
      const strengthParam = params.strength;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        // Resolve parameters at runtime
        const radius = resolveParam(radiusParam, agent, 75);
        const strength = resolveParam(strengthParam, agent, 1);
        
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const typeId = agent.get('typeId') as string;
        
        let centerX = 0;
        let centerY = 0;
        
        const others = env.helpers.kdtree.agentsWithinDistance(agent, radius, (a) => a.get('typeId') === typeId);
        if (others.length === 0) {
          return;
        }

        for (const other of others) {
          const ox = other.get('x') as number;
          const oy = other.get('y') as number;
          const dist = getDistance(x, y, ox, oy, envWidth, envHeight, wraparound);
          
          if (dist < radius) {
            // Accumulate positions (accounting for wraparound)
            const [dx, dy] = getDirection(x, y, ox, oy, envWidth, envHeight, wraparound);
            centerX += dx;
            centerY += dy;
          }
        }
        
        centerX /= others.length;
        centerY /= others.length;
        
        const vx = (agent.get('vx') as number) ?? 0;
        const vy = (agent.get('vy') as number) ?? 0;
        
        // Steer toward center of mass
        agent.set('vx', vx + centerX * strength * 0.01);
        agent.set('vy', vy + centerY * strength * 0.01);
      };
    }

    case 'wiggle': {
      const maxAngle = (params.angle ?? 30) * Math.PI / 180;
      
      return (agent: Agent) => {
        const vx = (agent.get('vx') as number) ?? 0;
        const vy = (agent.get('vy') as number) ?? 0;
        const mag = Math.sqrt(vx * vx + vy * vy);
        
        if (mag > 0) {
          const angle = Math.atan2(vy, vx);
          const wiggle = utils.random(-maxAngle, maxAngle, true);
          const newAngle = angle + wiggle;
          agent.set('vx', Math.cos(newAngle) * mag);
          agent.set('vy', Math.sin(newAngle) * mag);
        }
      };
    }

    case 'bounce': {
      return (agent: Agent) => {
        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        let vx = (agent.get('vx') as number) ?? 0;
        let vy = (agent.get('vy') as number) ?? 0;
        
        if (x < 0 || x >= envWidth) {
          vx = -vx;
          agent.set('vx', vx);
          agent.set('x', Math.max(0, Math.min(envWidth - 1, x)));
        }
        if (y < 0 || y >= envHeight) {
          vy = -vy;
          agent.set('vy', vy);
          agent.set('y', Math.max(0, Math.min(envHeight - 1, y)));
        }
      };
    }

    case 'on-collision': {
      const targetTypeId = params.target;
      const radius = params.radius ?? 10;
      const action = params.action ?? 'remove-target';
      
      if (!targetTypeId) return null;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        // Find colliding agent
        const neighbors = env.helpers.kdtree.agentsWithinDistance(agent, radius, (a) => a.get('typeId') === targetTypeId);
        if (neighbors.length === 0) {
          return;
        }
        
        // Execute action
        executeAction(agent, neighbors[0], action, params, env);
      };
    }

    case 'on-property': {
      const propName = params.property;
      const condition = params.condition ?? 'lte';
      const threshold = params.threshold ?? 0;
      const action = params.action ?? 'remove-self';
      
      if (!propName) return null;
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        const value = agent.get(propName) as number;
        if (value === null || value === undefined) return;
        
        // Check condition
        let conditionMet = false;
        switch (condition) {
          case 'eq': conditionMet = value === threshold; break;
          case 'neq': conditionMet = value !== threshold; break;
          case 'lt': conditionMet = value < threshold; break;
          case 'lte': conditionMet = value <= threshold; break;
          case 'gt': conditionMet = value > threshold; break;
          case 'gte': conditionMet = value >= threshold; break;
        }
        
        if (!conditionMet) return;
        
        // Execute action
        executeAction(agent, null, action, params, env);
      };
    }

    case 'increment-property': {
      const propName = params.property;
      const amount = params.amount ?? -1;
      
      if (!propName) return null;
      
      return (agent: Agent) => {
        const current = (agent.get(propName) as number) ?? 0;
        agent.set(propName, current + amount);
      };
    }

    case 'die': {
      const probability = params.probability ?? 0.01;
      
      return (agent: Agent) => {
        if (utils.random(0, 1, true) < probability) {
          agent.environment?.removeAgent(agent);
        }
      };
    }

    case 'reproduce': {
      const probability = params.probability ?? 0.01;
      const dist = utils.random(0, params.distance ?? 1, true);
      
      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        
        if (utils.random(0, 1, true) < probability) {
          const child = new Agent();
          const x = agent.get('x') as number;
          const y = agent.get('y') as number;
          
          child.set('typeId', agent.get('typeId'));
          const angle = utils.random(0, 2 * Math.PI, true);
          const deltaVec = {
            x: dist * Math.cos(angle),
            y: dist * Math.sin(angle),
          };
          child.set('x', x + deltaVec.x);
          child.set('y', y + deltaVec.y);
          
          // Copy velocity if present
          const vx = agent.get('vx');
          const vy = agent.get('vy');
          if (vx !== null) child.set('vx', vx);
          if (vy !== null) child.set('vy', vy);
          
          // Copy custom properties
          const agentType = model.agentTypes.find(t => t.id === agent.get('typeId'));
          if (agentType) {
            for (const prop of agentType.properties) {
              child.set(prop.name, agent.get(prop.name));
            }
          }
          
          // Copy tick function (access via .data since 'tick' is a disallowed get() key in Flocc)
          const tickFn = (agent as any).data?.tick;
          if (tickFn) child.set('tick', tickFn);
          
          env.addAgent(child);
        }
      };
    }

    default:
      return null;
  }
}

// ============================================================================
// Action Execution
// ============================================================================

/**
 * Execute an action from an event behavior
 */
function executeAction(
  agent: Agent,
  target: Agent | null,
  action: string,
  params: Record<string, any>,
  env: Environment
): void {
  switch (action) {
    case 'remove-self':
      env.removeAgent(agent);
      break;
      
    case 'remove-target':
      if (target) {
        env.removeAgent(target);
      }
      break;
      
    case 'set-property': {
      const propName = params.property ?? params.setProperty;
      const value = params.value ?? params.setValue ?? 0;
      if (propName) {
        agent.set(propName, value);
      }
      break;
    }
      
    case 'increment-property': {
      const propName = params.incrementProperty;
      const amount = params.incrementAmount ?? 1;
      if (propName) {
        const current = (agent.get(propName) as number) ?? 0;
        agent.set(propName, current + amount);
      }
      break;
    }
  }
}

// ============================================================================
// Parameter Resolution
// ============================================================================

/**
 * Resolve a parameter value. If the value is a string starting with "$",
 * it's treated as a parameter reference and read from the environment at runtime.
 * Otherwise, returns the literal value.
 * 
 * Usage in behavior params:
 *   radius: 25          -> returns 25
 *   radius: "$myParam"  -> returns env.get("myParam") at runtime
 */
function resolveParam(
  value: any, 
  agent: Agent, 
  fallback: any
): any {
  if (typeof value === 'string' && value.startsWith('$')) {
    const paramName = value.slice(1);
    const envValue = agent.environment?.get(paramName);
    return envValue !== undefined ? envValue : fallback;
  }
  return value ?? fallback;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the nearest agent of a given type
 */
function findNearest(
  agent: Agent, 
  typeId: string
): Agent | null {
  const env = agent.environment;
  if (!env) return null;
  
  const nearest = env.helpers.kdtree.nearestNeighbor(agent, (a) => a.get('typeId') === typeId);
  return nearest;
}

/**
 * Get distance between two points (accounting for wraparound)
 */
function getDistance(
  x1: number, y1: number, 
  x2: number, y2: number,
  width: number, height: number,
  wraparound: boolean
): number {
  const [dx, dy] = getDirection(x1, y1, x2, y2, width, height, wraparound);
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get direction vector from point 1 to point 2 (accounting for wraparound)
 */
function getDirection(
  x1: number, y1: number,
  x2: number, y2: number,
  width: number, height: number,
  wraparound: boolean
): [number, number] {
  let dx = x2 - x1;
  let dy = y2 - y1;
  
  if (wraparound) {
    // Use shortest path in torus
    if (Math.abs(dx) > width / 2) {
      dx = dx > 0 ? dx - width : dx + width;
    }
    if (Math.abs(dy) > height / 2) {
      dy = dy > 0 ? dy - height : dy + height;
    }
  }
  
  return [dx, dy];
}
