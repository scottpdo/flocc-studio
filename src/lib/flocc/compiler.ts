/**
 * Model Compiler
 * 
 * Compiles a StudioModel definition into executable simulation code.
 * Generates a setup function and metadata for the SimulationEngine.
 */

import { Environment, Agent, Terrain, Colors, utils } from 'flocc';
import type { StudioModel, AgentType, Behavior, TerrainConfig, Population } from '@/types';
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
  terrainSetup: ((env: Environment) => Terrain) | null;
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

      const terrainScale = model.terrain?.scale ?? 1;
      const positions = generatePositions(pop, envConfig, env, terrainScale);

      for (const pos of positions) {
        const agent = new Agent();
        agent.set('typeId', agentType.id);
        agent.set('x', pos.x);
        agent.set('y', pos.y);
        
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

  // Compile terrain setup if enabled
  const terrainSetup = model.terrain?.enabled
    ? compileTerrainSetup(model.terrain, envConfig)
    : null;

  return { setup, agentTypes, envConfig, terrainSetup };
}

// ============================================================================
// Agent Placement
// ============================================================================

function checkCondition(value: number, comparison: string, threshold: number): boolean {
  switch (comparison) {
    case 'gt':  return value > threshold;
    case 'lt':  return value < threshold;
    case 'gte': return value >= threshold;
    case 'lte': return value <= threshold;
    case 'eq':  return value === threshold;
    default:    return true;
  }
}

/**
 * Generate pixel-space {x, y} positions for a population based on its distribution.
 * Terrain must already be initialised in env.helpers.terrain before this is called.
 */
function generatePositions(
  pop: Population,
  envConfig: { width: number; height: number },
  env: Environment,
  terrainScale: number,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const terrain = (env as any).helpers?.terrain as Terrain | undefined;

  /** Pixels-to-luminance sample at a pixel-space point */
  function sampleLuminance(px: number, py: number): number {
    if (!terrain) return 0;
    const gx = Math.floor(px / terrainScale);
    const gy = Math.floor(py / terrainScale);
    const raw = terrain.sample(gx, gy);
    return typeof raw === 'number' ? raw : luminance(raw as { r: number; g: number; b: number; a: number });
  }

  switch (pop.distribution) {
    case 'grid-fill': {
      const gridW = Math.floor(envConfig.width  / terrainScale);
      const gridH = Math.floor(envConfig.height / terrainScale);

      // Collect all eligible cells (respecting terrainFilter)
      const eligible: { gx: number; gy: number }[] = [];
      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          if (pop.terrainFilter && terrain) {
            const raw = terrain.sample(gx, gy);
            const value = typeof raw === 'number'
              ? raw
              : luminance(raw as { r: number; g: number; b: number; a: number });
            if (!checkCondition(value, pop.terrainFilter.comparison, pop.terrainFilter.threshold)) continue;
          }
          eligible.push({ gx, gy });
        }
      }

      // Fisher-Yates shuffle so we pick a random subset
      for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(utils.random(0, i + 1, true));
        const tmp = eligible[i]; eligible[i] = eligible[j]; eligible[j] = tmp;
      }

      // density takes priority over count when set
      const targetCount = pop.density !== undefined
        ? Math.floor(pop.density * eligible.length)
        : Math.min(pop.count, eligible.length);

      for (let i = 0; i < targetCount; i++) {
        const { gx, gy } = eligible[i];
        // Place at cell centre
        positions.push({
          x: gx * terrainScale + terrainScale / 2,
          y: gy * terrainScale + terrainScale / 2,
        });
      }
      break;
    }

    case 'cluster': {
      const cx = (pop.clusterX ?? 0.5) * envConfig.width;
      const cy = (pop.clusterY ?? 0.5) * envConfig.height;
      const radius = pop.clusterRadius ?? Math.min(envConfig.width, envConfig.height) * 0.1;

      for (let i = 0; i < pop.count; i++) {
        const angle = utils.random(0, Math.PI * 2, true);
        const r = utils.random(0, radius, true);
        positions.push({
          x: Math.max(0, Math.min(envConfig.width  - 1, cx + Math.cos(angle) * r)),
          y: Math.max(0, Math.min(envConfig.height - 1, cy + Math.sin(angle) * r)),
        });
      }
      break;
    }

    case 'random':
    default: {
      const rx = pop.region?.x ?? 0;
      const ry = pop.region?.y ?? 0;
      const rw = pop.region?.width  ?? envConfig.width;
      const rh = pop.region?.height ?? envConfig.height;

      // With terrainFilter we rejection-sample; cap attempts to avoid infinite loops
      const maxAttempts = pop.terrainFilter ? pop.count * 20 : pop.count;
      let attempts = 0;
      while (positions.length < pop.count && attempts < maxAttempts) {
        attempts++;
        const x = utils.random(rx, rx + rw - 1, true);
        const y = utils.random(ry, ry + rh - 1, true);
        if (pop.terrainFilter) {
          const value = sampleLuminance(x, y);
          if (!checkCondition(value, pop.terrainFilter.comparison, pop.terrainFilter.threshold)) continue;
        }
        positions.push({ x, y });
      }
      break;
    }
  }

  return positions;
}

// ============================================================================
// Terrain Compilation
// ============================================================================

interface Pixel { r: number; g: number; b: number; a: number }

/** Perceptual luminance of a pixel, in the range 0-255. */
function luminance(p: Pixel): number {
  return Math.round(0.299 * p.r + 0.587 * p.g + 0.114 * p.b);
}

function hexToPixel(hex: string): Pixel {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: 255,
  };
}

function compileTerrainSetup(
  config: TerrainConfig,
  envConfig: { width: number; height: number }
): (env: Environment) => Terrain {
  // Resolve colors once at compile time (not per cell tick)
  const pixelLow = hexToPixel(config.colorLow ?? '#000000');
  const pixelHigh = hexToPixel(config.colorHigh ?? '#ffffff');

  return (env: Environment) => {
    const scale = config.scale || 1;
    const gridW = Math.floor(envConfig.width / scale);
    const gridH = Math.floor(envConfig.height / scale);

    const terrain = new Terrain(gridW, gridH, {
      grayscale: config.grayscale,
      scale,
    });

    // Init rule
    terrain.init((_x: number, _y: number) => {
      if (config.grayscale) {
        switch (config.initRule) {
          case 'uniform-white': return 255;
          case 'random-bw': return utils.random(0, 1, true) > 0.5 ? 255 : 0;
          case 'random-gray': return Math.floor(utils.random(0, 255, true));
          case 'uniform-black':
          default: return 0;
        }
      } else {
        switch (config.initRule) {
          case 'uniform-white': return { ...pixelHigh };
          case 'random-bw': return utils.random(0, 1, true) > 0.5 ? { ...pixelHigh } : { ...pixelLow };
          case 'random-gray': {
            // Random interpolation between colorLow and colorHigh
            const t = utils.random(0, 1, true);
            return {
              r: Math.round(pixelLow.r + t * (pixelHigh.r - pixelLow.r)),
              g: Math.round(pixelLow.g + t * (pixelHigh.g - pixelLow.g)),
              b: Math.round(pixelLow.b + t * (pixelHigh.b - pixelLow.b)),
              a: 255,
            };
          }
          case 'uniform-black':
          default: return { ...pixelLow };
        }
      }
    });

    // Update rule
    if (config.updateRule !== 'none') {
      terrain.addRule((x: number, y: number) => {
        if (config.updateRule === 'game-of-life') {
          return applyGameOfLife(terrain, config.grayscale, x, y, pixelLow, pixelHigh);
        }
        if (config.updateRule === 'diffusion') {
          return applyDiffusion(terrain, config.grayscale, x, y);
        }
      });
    }

    env.use(terrain);
    return terrain;
  };
}

function applyGameOfLife(
  terrain: Terrain, grayscale: boolean, x: number, y: number,
  pixelLow: Pixel, pixelHigh: Pixel,
): number | Pixel | undefined {
  const ALIVE: number | Pixel = grayscale ? 255 : { ...pixelHigh };
  const DEAD: number | Pixel = grayscale ? 0 : { ...pixelLow };

  const self = terrain.sample(x, y);
  const isAlive = grayscale
    ? (self as number) === 255
    : (self as Pixel).r === pixelHigh.r && (self as Pixel).g === pixelHigh.g && (self as Pixel).b === pixelHigh.b;

  const neighbors = terrain.neighbors(x, y, 1, true);
  const living = neighbors.filter((n: number | Pixel) =>
    grayscale
      ? n === 255
      : (n as Pixel).r === pixelHigh.r && (n as Pixel).g === pixelHigh.g && (n as Pixel).b === pixelHigh.b
  ).length;

  if (isAlive && (living < 2 || living > 3)) return DEAD;
  if (!isAlive && living === 3) return ALIVE;
  return undefined;
}

function applyDiffusion(
  terrain: Terrain, grayscale: boolean, x: number, y: number
): number | Pixel {
  const neighbors = terrain.neighbors(x, y, 1, false); // Von Neumann
  if (grayscale) {
    const self = terrain.sample(x, y) as number;
    const avg = (neighbors as number[]).reduce((s, v) => s + v, 0) / neighbors.length;
    return Math.round(self * 0.8 + avg * 0.2);
  } else {
    const self = terrain.sample(x, y) as Pixel;
    const count = neighbors.length;
    let rSum = 0, gSum = 0, bSum = 0;
    for (const n of neighbors as Pixel[]) {
      rSum += n.r; gSum += n.g; bSum += n.b;
    }
    return {
      r: Math.round(self.r * 0.8 + (rSum / count) * 0.2),
      g: Math.round(self.g * 0.8 + (gSum / count) * 0.2),
      b: Math.round(self.b * 0.8 + (bSum / count) * 0.2),
      a: 255,
    };
  }
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
          
          // For custom properties, use default value
          const agentType = model.agentTypes.find(t => t.id === agent.get('typeId'));
          if (agentType) {
            for (const prop of agentType.properties) {
              child.set(prop.name, prop.defaultValue);
            }
          }
          
          // Copy tick function (access via .data since 'tick' is a disallowed get() key in Flocc)
          const tickFn = (agent as any).data?.tick;
          if (tickFn) child.set('tick', tickFn);
          
          env.addAgent(child);
        }
      };
    }

    case 'on-terrain': {
      const condition = params.condition ?? 'gt';
      const threshold = params.threshold ?? 128;
      const action = params.action ?? 'remove-self';
      // Capture terrain config at compile time
      const terrainScale = model.terrain?.scale ?? 1;
      const terrainGrayscale = model.terrain?.grayscale ?? true;

      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        const terrain = (env as any).helpers?.terrain as Terrain | undefined;
        if (!terrain) return;

        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const gx = Math.floor(x / terrainScale);
        const gy = Math.floor(y / terrainScale);

        const raw = terrain.sample(gx, gy);
        const value = terrainGrayscale
          ? (raw as number)
          : luminance(raw as Pixel);

        let conditionMet = false;
        switch (condition) {
          case 'eq':  conditionMet = value === threshold; break;
          case 'neq': conditionMet = value !== threshold; break;
          case 'lt':  conditionMet = value < threshold;   break;
          case 'lte': conditionMet = value <= threshold;  break;
          case 'gt':  conditionMet = value > threshold;   break;
          case 'gte': conditionMet = value >= threshold;  break;
        }

        if (!conditionMet) return;
        executeAction(agent, null, action, params, env);
      };
    }

    case 'modify-terrain': {
      const writeMode = (params.value as 'low' | 'high' | 'toggle') ?? 'high';
      const terrainScale = model.terrain?.scale ?? 1;
      const terrainGrayscale = model.terrain?.grayscale ?? true;
      // Resolve low/high values once at compile time
      const lowValue: number | Pixel = terrainGrayscale
        ? 0
        : hexToPixel(model.terrain?.colorLow ?? '#000000');
      const highValue: number | Pixel = terrainGrayscale
        ? 255
        : hexToPixel(model.terrain?.colorHigh ?? '#ffffff');

      return (agent: Agent) => {
        const env = agent.environment;
        if (!env) return;
        const terrain = (env as any).helpers?.terrain as Terrain | undefined;
        if (!terrain) return;

        const x = agent.get('x') as number;
        const y = agent.get('y') as number;
        const gx = Math.floor(x / terrainScale);
        const gy = Math.floor(y / terrainScale);

        let writeValue: number | Pixel;
        if (writeMode === 'toggle') {
          const current = terrain.sample(gx, gy);
          const currentNum = terrainGrayscale
            ? (current as number)
            : luminance(current as Pixel);
          writeValue = currentNum > 127 ? lowValue : highValue;
        } else {
          writeValue = writeMode === 'high' ? highValue : lowValue;
        }

        terrain.set(gx, gy, writeValue as number);
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
