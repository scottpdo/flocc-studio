/**
 * Seed script — Featured Models
 *
 * Inserts three canonical ABM examples into the database with
 * isFeatured = true and isPublic = true.
 *
 * Safe to run multiple times (uses onConflictDoNothing).
 *
 * Usage:
 *   npm run seed:featured
 *
 * For production (Vercel + Neon), set DATABASE_URL before running:
 *   DATABASE_URL="..." npm run seed:featured
 *   or: vercel env pull .env.production.local && npm run seed:featured
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { models } from '../src/lib/db/schema';
import { nanoid } from 'nanoid';
import type { StudioModel } from '../src/types';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is not set. Exiting.');
  process.exit(1);
}

const db = drizzle(neon(url));
const now = new Date();

// ============================================================================
// Model 1: Flocking (Boids)
// ============================================================================

const boidTypeId = nanoid();
const flockingId = nanoid();

const flocking: StudioModel = {
  id: flockingId,
  name: 'Flocking',
  description:
    'Classic Boids flocking simulation. Agents follow three simple rules — separation, alignment, and cohesion — producing emergent flock behavior from purely local interactions.',
  environment: { width: 800, height: 600, wraparound: true },
  agentTypes: [
    {
      id: boidTypeId,
      name: 'Boid',
      color: '#60a5fa',
      shape: 'arrow',
      size: 6,
      properties: [],
      behaviors: [
        { id: nanoid(), type: 'move-forward', params: { speed: 2 }, enabled: true },
        { id: nanoid(), type: 'wiggle', params: { angle: 10 }, enabled: true },
        { id: nanoid(), type: 'separate', params: { radius: 20, strength: 1.5 }, enabled: true },
        { id: nanoid(), type: 'align', params: { radius: 50, strength: 1 }, enabled: true },
        { id: nanoid(), type: 'cohere', params: { radius: 75, strength: 1 }, enabled: true },
      ],
    },
  ],
  populations: [{ id: nanoid(), agentTypeId: boidTypeId, count: 150, distribution: 'random' }],
  parameters: [],
  visualizations: [
    {
      id: nanoid(),
      name: 'Population',
      type: 'line-chart',
      enabled: true,
      series: [
        {
          id: nanoid(),
          name: 'Boids',
          color: '#60a5fa',
          metric: { type: 'count', agentTypeId: boidTypeId },
        },
      ],
      options: { autoScale: true, autoScroll: true },
    },
  ],
  tags: ['flocking', 'boids', 'classic'],
  version: 1,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  isPublic: true,
  isFeatured: true,
  forkCount: 0,
  viewCount: 0,
};

// ============================================================================
// Model 2: Predator-Prey (Lotka-Volterra)
// ============================================================================

const preyTypeId = nanoid();
const predTypeId = nanoid();
const predatorPreyId = nanoid();

const predatorPrey: StudioModel = {
  id: predatorPreyId,
  name: 'Predator-Prey',
  description:
    'Lotka-Volterra predator-prey dynamics. Prey reproduce and flee; predators hunt, eat, and reproduce. Watch the populations oscillate in classic boom-and-bust cycles.',
  environment: { width: 800, height: 600, wraparound: true },
  agentTypes: [
    {
      id: preyTypeId,
      name: 'Prey',
      color: '#4ade80',
      shape: 'circle',
      size: 4,
      properties: [],
      behaviors: [
        { id: nanoid(), type: 'random-walk', params: { speed: 1.5 }, enabled: true },
        { id: nanoid(), type: 'reproduce', params: { probability: 0.004, distance: 10 }, enabled: true },
        {
          id: nanoid(),
          type: 'on-collision',
          params: { target: predTypeId, radius: 10, action: 'remove-self' },
          enabled: true,
        },
      ],
    },
    {
      id: predTypeId,
      name: 'Predator',
      color: '#f87171',
      shape: 'triangle',
      size: 7,
      properties: [],
      behaviors: [
        { id: nanoid(), type: 'move-toward', params: { target: preyTypeId, speed: 2.5 }, enabled: true },
        { id: nanoid(), type: 'die', params: { probability: 0.003 }, enabled: true },
        {
          id: nanoid(),
          type: 'on-collision',
          params: { target: preyTypeId, radius: 10, action: 'remove-target' },
          enabled: true,
        },
        { id: nanoid(), type: 'reproduce', params: { probability: 0.003, distance: 5 }, enabled: true },
      ],
    },
  ],
  populations: [
    { id: nanoid(), agentTypeId: preyTypeId, count: 100, distribution: 'random' },
    { id: nanoid(), agentTypeId: predTypeId, count: 10, distribution: 'random' },
  ],
  parameters: [],
  visualizations: [
    {
      id: nanoid(),
      name: 'Population',
      type: 'line-chart',
      enabled: true,
      series: [
        {
          id: nanoid(),
          name: 'Prey',
          color: '#4ade80',
          metric: { type: 'count', agentTypeId: preyTypeId },
        },
        {
          id: nanoid(),
          name: 'Predators',
          color: '#f87171',
          metric: { type: 'count', agentTypeId: predTypeId },
        },
      ],
      options: { autoScale: true, autoScroll: true },
    },
  ],
  tags: ['predator-prey', 'lotka-volterra', 'classic'],
  version: 1,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  isPublic: true,
  isFeatured: true,
  forkCount: 0,
  viewCount: 0,
};

// ============================================================================
// Model 3: Disease Spread (SIR approximation)
// ============================================================================

const susceptibleTypeId = nanoid();
const infectedTypeId = nanoid();
const diseaseId = nanoid();

const diseaseSpread: StudioModel = {
  id: diseaseId,
  name: 'Disease Spread',
  description:
    'A simple epidemic model. Susceptible agents are removed when they contact an infected agent. Infected agents reproduce and gradually die out, creating a rising-then-falling infection curve.',
  environment: { width: 800, height: 600, wraparound: false },
  agentTypes: [
    {
      id: susceptibleTypeId,
      name: 'Susceptible',
      color: '#93c5fd',
      shape: 'circle',
      size: 4,
      properties: [],
      behaviors: [
        { id: nanoid(), type: 'random-walk', params: { speed: 2 }, enabled: true },
        { id: nanoid(), type: 'bounce', params: {}, enabled: true },
        {
          id: nanoid(),
          type: 'on-collision',
          params: { target: infectedTypeId, radius: 8, action: 'remove-self' },
          enabled: true,
        },
      ],
    },
    {
      id: infectedTypeId,
      name: 'Infected',
      color: '#f87171',
      shape: 'circle',
      size: 4,
      properties: [],
      behaviors: [
        { id: nanoid(), type: 'random-walk', params: { speed: 2 }, enabled: true },
        { id: nanoid(), type: 'bounce', params: {}, enabled: true },
        { id: nanoid(), type: 'reproduce', params: { probability: 0.012, distance: 3 }, enabled: true },
        { id: nanoid(), type: 'die', params: { probability: 0.005 }, enabled: true },
      ],
    },
  ],
  populations: [
    { id: nanoid(), agentTypeId: susceptibleTypeId, count: 200, distribution: 'random' },
    { id: nanoid(), agentTypeId: infectedTypeId, count: 5, distribution: 'random' },
  ],
  parameters: [],
  visualizations: [
    {
      id: nanoid(),
      name: 'Population',
      type: 'line-chart',
      enabled: true,
      series: [
        {
          id: nanoid(),
          name: 'Susceptible',
          color: '#93c5fd',
          metric: { type: 'count', agentTypeId: susceptibleTypeId },
        },
        {
          id: nanoid(),
          name: 'Infected',
          color: '#f87171',
          metric: { type: 'count', agentTypeId: infectedTypeId },
        },
      ],
      options: { autoScale: true, autoScroll: true },
    },
  ],
  tags: ['epidemic', 'disease', 'sir', 'classic'],
  version: 1,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
  isPublic: true,
  isFeatured: true,
  forkCount: 0,
  viewCount: 0,
};

// ============================================================================
// Insert
// ============================================================================

async function main() {
  const seedModels = [flocking, predatorPrey, diseaseSpread];

  console.log('Seeding featured models...');

  for (const model of seedModels) {
    await db
      .insert(models)
      .values({
        id: model.id,
        name: model.name,
        description: model.description,
        definition: model,
        isPublic: true,
        isFeatured: true,
        forkCount: 0,
        viewCount: 0,
        version: 1,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    console.log(`  ✓ ${model.name}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
