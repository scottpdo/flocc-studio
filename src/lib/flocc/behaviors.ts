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
  category: 'movement' | 'flocking' | 'events' | 'lifecycle';
  params: ParamDef[];
}

export interface ParamDef {
  key: string;
  name: string;
  type: 'number' | 'agentType' | 'boolean' | 'action' | 'condition' | 'property';
  default: any;
  min?: number;
  max?: number;
  step?: number;
  // For conditional params that only show based on another param's value
  showWhen?: { param: string; value: any };
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
  
  // Event behaviors
  {
    type: 'on-collision',
    name: 'On Collision',
    description: 'Trigger an action when colliding with another agent',
    category: 'events',
    params: [
      { key: 'target', name: 'Collide With', type: 'agentType', default: null },
      { key: 'radius', name: 'Radius', type: 'number', default: 10, min: 1, max: 50, step: 1 },
      { key: 'action', name: 'Action', type: 'action', default: 'remove-target' },
      // Params for set-property / increment-property actions
      { key: 'property', name: 'Property', type: 'property', default: null, showWhen: { param: 'action', value: 'set-property' } },
      { key: 'value', name: 'Value', type: 'number', default: 0, showWhen: { param: 'action', value: 'set-property' } },
      { key: 'incrementProperty', name: 'Property', type: 'property', default: null, showWhen: { param: 'action', value: 'increment-property' } },
      { key: 'incrementAmount', name: 'Amount', type: 'number', default: 1, step: 0.1, showWhen: { param: 'action', value: 'increment-property' } },
    ],
  },
  {
    type: 'on-property',
    name: 'On Property',
    description: 'Trigger an action when a property meets a condition',
    category: 'events',
    params: [
      { key: 'property', name: 'Property', type: 'property', default: null },
      { key: 'condition', name: 'Condition', type: 'condition', default: 'lte' },
      { key: 'threshold', name: 'Threshold', type: 'number', default: 0 },
      { key: 'action', name: 'Action', type: 'action', default: 'remove-self' },
      // Params for set-property action
      { key: 'setProperty', name: 'Property', type: 'property', default: null, showWhen: { param: 'action', value: 'set-property' } },
      { key: 'setValue', name: 'Value', type: 'number', default: 0, showWhen: { param: 'action', value: 'set-property' } },
      // Params for increment-property action
      { key: 'incrementProperty', name: 'Property', type: 'property', default: null, showWhen: { param: 'action', value: 'increment-property' } },
      { key: 'incrementAmount', name: 'Amount', type: 'number', default: 1, step: 0.1, showWhen: { param: 'action', value: 'increment-property' } },
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
 * Action options for event behaviors
 */
export const ACTION_OPTIONS = [
  { value: 'remove-self', label: 'Remove Self' },
  { value: 'remove-target', label: 'Remove Target' },
  { value: 'set-property', label: 'Set Property' },
  { value: 'increment-property', label: 'Increment Property' },
];

/**
 * Condition options for on-property behavior
 */
export const CONDITION_OPTIONS = [
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '≤' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '≥' },
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
      // Skip conditional params that have showWhen
      if (!param.showWhen) {
        params[param.key] = param.default;
      }
    }
  }
  
  return { id, type, params, enabled: true };
}
