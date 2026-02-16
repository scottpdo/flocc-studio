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
 * Library of available behaviors for the MVP
 */
export const BEHAVIOR_LIBRARY: BehaviorDef[] = [
  {
    type: 'random-walk',
    name: 'Random Walk',
    description: 'Move in a random direction each tick',
    params: [
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'move-toward',
    name: 'Move Toward',
    description: 'Move toward the nearest agent of a type',
    params: [
      { key: 'target', name: 'Target', type: 'agentType', default: null },
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
    ],
  },
  {
    type: 'move-away',
    name: 'Move Away',
    description: 'Move away from the nearest agent of a type',
    params: [
      { key: 'target', name: 'Target', type: 'agentType', default: null },
      { key: 'speed', name: 'Speed', type: 'number', default: 2, min: 0.1, max: 20, step: 0.1 },
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
