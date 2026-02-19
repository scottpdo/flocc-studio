/**
 * Starter Templates
 *
 * Pre-configured StudioModel definitions that users can start from.
 * IDs are generated fresh on each call so each new model is independent.
 */

import { nanoid } from 'nanoid';
import type { StudioModel } from '@/types';

// ─── Blank ────────────────────────────────────────────────────────────────────

export function createBlankModel(): StudioModel {
  return {
    id: nanoid(),
    name: 'Untitled Model',
    description: '',
    environment: {
      width: 800,
      height: 800,
      wraparound: true,
      backgroundColor: '#1a1a2e',
    },
    agentTypes: [],
    populations: [],
    parameters: [],
    tags: [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
    isFeatured: false,
    forkCount: 0,
    viewCount: 0,
  };
}

// ─── Flocking ─────────────────────────────────────────────────────────────────

export function createFlockingTemplate(): StudioModel {
  const boidId = nanoid();
  const popId = nanoid();

  return {
    id: nanoid(),
    name: 'Flocking',
    description:
      'Classic Reynolds boids: separation, alignment, and cohesion produce emergent flocking. Adjust the parameter sliders to see how each force shapes the flock.',
    environment: {
      width: 800,
      height: 800,
      wraparound: true,
      backgroundColor: '#0f172a',
    },
    agentTypes: [
      {
        id: boidId,
        name: 'Boid',
        color: '#60a5fa',
        shape: 'arrow',
        size: 8,
        properties: [],
        behaviors: [
          { id: nanoid(), type: 'move-forward', params: { speed: '$speed' }, enabled: true },
          { id: nanoid(), type: 'wiggle',       params: { angle: 15 },       enabled: true },
          { id: nanoid(), type: 'separate', params: { radius: '$separationRadius', strength: '$separationWeight' }, enabled: true },
          { id: nanoid(), type: 'align',    params: { radius: '$alignmentRadius',  strength: '$alignmentWeight'  }, enabled: true },
          { id: nanoid(), type: 'cohere',   params: { radius: '$cohesionRadius',   strength: '$cohesionWeight'   }, enabled: true },
        ],
      },
    ],
    populations: [
      { id: popId, agentTypeId: boidId, count: 100, distribution: 'random' },
    ],
    parameters: [
      { id: nanoid(), name: 'speed',             type: 'number', value: 2,  min: 0.5, max: 8,   step: 0.5 },
      { id: nanoid(), name: 'separationRadius',  type: 'number', value: 25, min: 5,   max: 80,  step: 1   },
      { id: nanoid(), name: 'separationWeight',  type: 'number', value: 1,  min: 0,   max: 3,   step: 0.1 },
      { id: nanoid(), name: 'alignmentRadius',   type: 'number', value: 50, min: 10,  max: 150, step: 1   },
      { id: nanoid(), name: 'alignmentWeight',   type: 'number', value: 1,  min: 0,   max: 3,   step: 0.1 },
      { id: nanoid(), name: 'cohesionRadius',    type: 'number', value: 75, min: 10,  max: 200, step: 1   },
      { id: nanoid(), name: 'cohesionWeight',    type: 'number', value: 1,  min: 0,   max: 3,   step: 0.1 },
    ],
    tags: ['flocking', 'movement'],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
    isFeatured: false,
    forkCount: 0,
    viewCount: 0,
  };
}

// ─── Predator-Prey ────────────────────────────────────────────────────────────

export function createPredatorPreyTemplate(): StudioModel {
  const sheepId = nanoid();
  const wolfId  = nanoid();
  const sheepPopId = nanoid();
  const wolfPopId  = nanoid();

  return {
    id: nanoid(),
    name: 'Predator-Prey',
    description:
      'Lotka-Volterra dynamics: sheep graze and reproduce; wolves hunt sheep and reproduce when successful; both die from baseline mortality. Adjust the sliders to find a stable equilibrium — or tip the ecosystem into extinction.',
    environment: {
      width: 800,
      height: 600,
      wraparound: true,
      backgroundColor: '#0f2010',
    },
    agentTypes: [
      {
        id: sheepId,
        name: 'Sheep',
        color: '#e2e8f0',
        shape: 'circle',
        size: 6,
        properties: [],
        behaviors: [
          { id: nanoid(), type: 'random-walk', params: { speed: '$sheepSpeed' },    enabled: true },
          { id: nanoid(), type: 'reproduce',   params: { probability: '$sheepReproduce' }, enabled: true },
          { id: nanoid(), type: 'die',         params: { probability: '$sheepMortality' }, enabled: true },
        ],
      },
      {
        id: wolfId,
        name: 'Wolf',
        color: '#94a3b8',
        shape: 'circle',
        size: 10,
        properties: [],
        behaviors: [
          { id: nanoid(), type: 'move-toward',  params: { speed: '$wolfSpeed', target: sheepId }, enabled: true },
          { id: nanoid(), type: 'on-collision', params: { target: sheepId, radius: 10, action: 'remove-target' }, enabled: true },
          { id: nanoid(), type: 'reproduce',    params: { probability: '$wolfReproduce' },  enabled: true },
          { id: nanoid(), type: 'die',          params: { probability: '$wolfMortality' },  enabled: true },
        ],
      },
    ],
    populations: [
      { id: sheepPopId, agentTypeId: sheepId, count: 200, distribution: 'random' },
      { id: wolfPopId,  agentTypeId: wolfId,  count: 40,  distribution: 'random' },
    ],
    parameters: [
      { id: nanoid(), name: 'sheepSpeed',     type: 'number', value: 1.5,  min: 0.5, max: 5,    step: 0.5  },
      { id: nanoid(), name: 'sheepReproduce', type: 'number', value: 0.03, min: 0,   max: 0.15, step: 0.005 },
      { id: nanoid(), name: 'sheepMortality', type: 'number', value: 0.001,min: 0,   max: 0.05, step: 0.001 },
      { id: nanoid(), name: 'wolfSpeed',      type: 'number', value: 2.5,  min: 0.5, max: 8,    step: 0.5  },
      { id: nanoid(), name: 'wolfReproduce',  type: 'number', value: 0.05, min: 0,   max: 0.2,  step: 0.005 },
      { id: nanoid(), name: 'wolfMortality',  type: 'number', value: 0.02, min: 0,   max: 0.1,  step: 0.005 },
    ],
    tags: ['ecology', 'predator-prey'],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPublic: false,
    isFeatured: false,
    forkCount: 0,
    viewCount: 0,
  };
}

// ─── Registry ─────────────────────────────────────────────────────────────────

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  /** Emoji used as a stand-in thumbnail */
  icon: string;
  tags: string[];
  create: () => StudioModel;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with an empty canvas.',
    icon: '📄',
    tags: [],
    create: createBlankModel,
  },
  {
    id: 'flocking',
    name: 'Flocking',
    description: 'Emergent flock behavior from three simple local rules.',
    icon: '🐦',
    tags: ['flocking', 'movement'],
    create: createFlockingTemplate,
  },
  {
    id: 'predator-prey',
    name: 'Predator-Prey',
    description: 'Wolves hunt sheep; populations oscillate in boom-bust cycles.',
    icon: '🐺',
    tags: ['ecology', 'predator-prey'],
    create: createPredatorPreyTemplate,
  },
];
