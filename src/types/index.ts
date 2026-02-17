/**
 * Flocc Studio Types
 */

// ============================================================================
// Model Definition Types
// ============================================================================

export interface StudioModel {
  id: string;
  slug?: string;
  name: string;
  description?: string;

  environment: EnvironmentConfig;
  agentTypes: AgentType[];
  populations: Population[];
  parameters: Parameter[];

  // Metadata
  tags: string[];
  thumbnailUrl?: string;

  // Versioning
  version: number;
  createdAt: string;
  updatedAt: string;

  // Ownership
  userId?: string;
  isPublic: boolean;
  isFeatured: boolean;

  // Stats
  forkOf?: string;
  forkCount: number;
  viewCount: number;
}

export interface EnvironmentConfig {
  width: number;
  height: number;
  wraparound: boolean;
  backgroundColor?: string;
}

export interface AgentType {
  id: string;
  name: string;
  color: string;
  shape: 'circle' | 'triangle' | 'square' | 'arrow' | 'custom';
  size: number;
  properties: PropertyDef[];
  behaviors: Behavior[];
}

export interface PropertyDef {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'string';
  defaultValue: any;
  min?: number;
  max?: number;
}

export interface Behavior {
  id: string;
  type: BehaviorType;
  params: Record<string, any>;
  enabled: boolean;
}

export type BehaviorType =
  | 'random-walk'
  | 'move-forward'
  | 'move-toward'
  | 'move-away'
  | 'wiggle'
  | 'bounce'
  | 'separate'
  | 'align'
  | 'cohere'
  | 'on-collision'
  | 'on-property'
  | 'die'
  | 'reproduce';

// Action types for event-triggered behaviors
export type BehaviorAction =
  | 'remove-self'
  | 'remove-target'
  | 'set-property'
  | 'increment-property';

export interface Population {
  id: string;
  agentTypeId: string;
  count: number;
  distribution: 'random' | 'grid' | 'cluster' | 'custom';
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Parameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'choice';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// ============================================================================
// Simulation Runtime Types
// ============================================================================

export interface AgentSnapshot {
  id: string;
  typeId: string;
  x: number;
  y: number;
  properties: Record<string, any>;
}

export interface SimulationState {
  status: 'idle' | 'running' | 'paused';
  tick: number;
  agents: AgentSnapshot[];
  metrics: Record<string, number>;
}

// ============================================================================
// User Types
// ============================================================================

export interface PublicUser {
  id: string;
  username: string;
  displayName?: string;
  image?: string;
  createdAt: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface ModelListParams {
  page?: number;
  limit?: number;
  userId?: string;
  tag?: string;
  featured?: boolean;
  search?: string;
}

export interface ModelListResponse {
  models: StudioModel[];
  total: number;
  page: number;
  limit: number;
}
