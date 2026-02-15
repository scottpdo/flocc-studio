/**
 * Database Schema — Drizzle ORM
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { StudioModel } from '@/types';

// ============================================================================
// NextAuth.js Tables
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  username: text('username').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ============================================================================
// Application Tables
// ============================================================================

export const models = pgTable('models', {
  id: text('id').primaryKey(),
  slug: text('slug').unique(),
  userId: text('user_id').references(() => users.id),

  name: text('name').notNull(),
  description: text('description'),
  definition: jsonb('definition').$type<StudioModel>().notNull(),

  isPublic: boolean('is_public').default(false),
  isFeatured: boolean('is_featured').default(false),

  thumbnailUrl: text('thumbnail_url'),

  forkOf: text('fork_of'),
  forkCount: integer('fork_count').default(0),
  viewCount: integer('view_count').default(0),

  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const modelVersions = pgTable('model_versions', {
  id: text('id').primaryKey(),
  modelId: text('model_id')
    .notNull()
    .references(() => models.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  definition: jsonb('definition').$type<StudioModel>().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
});

export const modelTags = pgTable(
  'model_tags',
  {
    modelId: text('model_id')
      .notNull()
      .references(() => models.id, { onDelete: 'cascade' }),
    tagId: text('tag_id')
      .notNull()
      .references(() => tags.id),
  },
  (t) => [primaryKey({ columns: [t.modelId, t.tagId] })]
);

// ============================================================================
// Type Exports
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
