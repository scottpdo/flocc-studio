/**
 * Behavior Library
 * 
 * Defines available behaviors, their parameters, and metadata for the UI.
 * Behaviors are compiled to Flocc agent rules at runtime.
 */

import type { BehaviorType } from '@/types';

// ============================================================================
// Behavior Definitions
// ============================================================================

export interface BehaviorDef {
  type: BehaviorType;
  name: string;
  description: string;
  category: 'movement' | 'flocking' | 'interaction' | 'lifecycle';
  params: ParamDef[];
}

export interface ParamDef {
  key: string;
  name: string;
  type: 'number' | 'agentType' | 'boolean';
  default: any;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Library of available behaviors
 */
export const BEHAVIOR_LIBRARY: BehaviorDef[] = [
  // Movement behaviors
  {
    type: 'random-walk',
    name: 'Random Walk',
    description: 'Move in a random direction each tick',
    category: 'movement',
    params: [
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'move-forward',
    name: 'Move Forward',
    description: 'Move in the current velocity direction',
    category: 'movement',
    params: [
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'move-toward',
    name: 'Move Toward',
    description: 'Move toward the nearest agent of a type',
    category: 'movement',
    params: [
      { key: 'target', name: 'Target', type: 'agentType', default: null },
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'move-away',
    name: 'Move Away',
    description: 'Move away from the nearest agent of a type',
    category: 'movement',
    params: [
      { key: 'target', name: 'Target', type: 'agentType', default: null },
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'wiggle',
    name: 'Wiggle',
    description: 'Add random variation to movement direction',
    category: 'movement',
    params: [
      { key: 'angle', name: 'Max Angle (°)', type: 'number', default: 30, min: 0, max: 180, step: 5 },
    ],
  },
  {
    type: 'bounce',
    name: 'Bounce Off Edges',
    description: 'Reverse direction when hitting environment boundaries',
    category: 'movement',
    params: [],
  },
  
  // Flocking behaviors
  {
    type: 'separate',
    name: 'Separate',
    description: 'Steer away from nearby agents to avoid crowding',
    category: 'flocking',
    params: [
      { key: 'radius', name: 'Radius', type: 'number', default: 25, min: 5, max: 100, step: 5 },
      { key: 'strength', name: 'Strength', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    type: 'align',
    name: 'Align',
    description: 'Steer toward the average heading of nearby agents',
    category: 'flocking',
    params: [
      { key: 'radius', name: 'Radius', type: 'number', default: 50, min: 10, max: 150, step: 5 },
      { key: 'strength', name: 'Strength', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  {
    type: 'cohere',
    name: 'Cohere',
    description: 'Steer toward the center of mass of nearby agents',
    category: 'flocking',
    params: [
      { key: 'radius', name: 'Radius', type: 'number', default: 75, min: 20, max: 200, step: 5 },
      { key: 'strength', name: 'Strength', type: 'number', default: 1, min: 0.1, max: 5, step: 0.1 },
    ],
  },
  
  // Lifecycle behaviors
  {
    type: 'die',
    name: 'Die',
    description: 'Remove agent with a probability each tick',
    category: 'lifecycle',
    params: [
      { key: 'probability', name: 'Probability', type: 'number', default: 0.01, min: 0, max: 1, step: 0.01 },
    ],
  },
  {
    type: 'reproduce',
    name: 'Reproduce',
    description: 'Create a copy of this agent with a probability',
    category: 'lifecycle',
    params: [
      { key: 'probability', name: 'Probability', type: 'number', default: 0.01, min: 0, max: 1, step: 0.01 },
    ],
  },
];

/**
 * Get behavior definition by type
 */
export function getBehaviorDef(type: BehaviorType): BehaviorDef | undefined {
  return BEHAVIOR_LIBRARY.find((b) => b.type === type);
}

/**
 * Create a new behavior instance with default params
 */
export function createBehavior(type: BehaviorType, id: string): {
  id: string;
  type: BehaviorType;
  params: Record<string, any>;
  enabled: boolean;
} {
  const def = getBehaviorDef(type);
  const params: Record<string, any> = {};
  
  if (def) {
    for (const param of def.params) {
      params[param.key] = param.default;
    }
  }
  
  return { id, type, params, enabled: true };
}
