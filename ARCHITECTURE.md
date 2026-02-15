# Flocc Studio — Architecture

*A browser-based visual environment for agent-based modeling*

---

## Overview

Flocc Studio is a web application that lets users create, edit, run, and share agent-based models without writing code. It uses Flocc Core as its simulation engine and provides a visual interface for defining agents, behaviors, and environments.

### Design Principles

1. **Browser-first** — No installation, runs anywhere
2. **Progressive complexity** — Simple for beginners, powerful for experts
3. **Shareable** — Every model has a URL; embedding is trivial
4. **Offline-capable** — Core editing/simulation works without network
5. **Open** — Export to standalone Flocc code at any time

---

## User Flows

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLOCC STUDIO                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Anonymous User                    Authenticated User           │
│  ─────────────────                 ────────────────────         │
│  • Browse public models            • Everything anonymous +     │
│  • Fork to scratch pad             • Save models to account     │
│  • Run simulations                 • Publish/unpublish models   │
│  • Export as code                  • Edit published models      │
│  • Share via URL (ephemeral)       • Manage model versions      │
│                                    • Profile page with models   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | **Next.js 14+** (App Router) | React ecosystem, SSR/SSG, API routes built-in |
| State | **Zustand** + **React Context** | Zustand for model/simulation, Context for UI/auth |
| Styling | **Tailwind CSS** | Rapid UI development |
| Canvas | **HTML Canvas** / **PixiJS** | Flocc's CanvasRenderer, or PixiJS for performance |
| Code Editor | **Monaco** (optional) | For hybrid visual/code mode |
| Drag & Drop | **dnd-kit** | Best React DnD library |
| Undo/Redo | **Zustand temporal** | Middleware for time-travel state |

### State Management Strategy

**Zustand** (model + simulation):
- Model definition (agent types, behaviors, environment)
- Simulation runtime state (tick, playing, agent snapshots)
- Undo/redo via `temporal` middleware
- Selective subscriptions prevent re-render storms

**React Context** (UI + auth):
- Current user / auth state
- Theme preferences
- Panel visibility, modal state
- Non-performance-critical global state

### Project Structure

```
src/
├── app/
│   ├── layout.tsx                      # Root layout, providers
│   ├── page.tsx                        # Landing / featured models
│   ├── explore/
│   │   └── page.tsx                    # Model gallery (SSR)
│   ├── model/
│   │   ├── new/
│   │   │   └── page.tsx                # Create new model
│   │   └── [id]/
│   │       ├── page.tsx                # View/run model (SSR + client)
│   │       └── edit/
│   │           └── page.tsx            # Edit model (client)
│   ├── user/
│   │   └── [username]/
│   │       └── page.tsx                # Profile + user's models
│   ├── docs/
│   │   └── [[...slug]]/
│   │       └── page.tsx                # Documentation
│   └── api/
│       ├── models/
│       │   ├── route.ts                # GET list, POST create
│       │   └── [id]/
│       │       └── route.ts            # GET, PUT, DELETE
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts            # NextAuth.js handlers
│       └── export/
│           └── [id]/
│               └── route.ts            # Generate standalone export
│
├── components/
│   ├── editor/
│   │   ├── AgentPanel.tsx              # Define agent types
│   │   ├── BehaviorBuilder.tsx         # Visual rule editor
│   │   ├── EnvironmentPanel.tsx        # World settings
│   │   ├── ParameterSliders.tsx        # Adjustable params
│   │   ├── PropertyInspector.tsx
│   │   └── EditorLayout.tsx            # Editor shell
│   │
│   ├── simulation/
│   │   ├── Canvas.tsx                  # Flocc renderer wrapper
│   │   ├── Controls.tsx                # Play/pause/step/speed
│   │   ├── Timeline.tsx                # Scrub through history
│   │   └── DataOverlay.tsx             # Live statistics
│   │
│   ├── library/
│   │   ├── ModelCard.tsx               # Gallery thumbnail
│   │   ├── ModelGrid.tsx               # Browse/search
│   │   └── ModelFilters.tsx            # Tags, categories
│   │
│   └── ui/                             # Shared primitives
│       ├── Button.tsx
│       ├── Modal.tsx
│       ├── Toast.tsx
│       └── ...
│
├── stores/
│   ├── model.ts              # Zustand: model definition
│   ├── simulation.ts         # Zustand: runtime state
│   └── history.ts            # Zustand temporal middleware
│
├── contexts/
│   ├── AuthContext.tsx       # User session
│   └── UIContext.tsx         # Theme, panels, modals
│
├── lib/
│   ├── flocc/
│   │   ├── compiler.ts       # Model definition → Flocc code
│   │   ├── runtime.ts        # Execute simulation in worker
│   │   ├── behaviors.ts      # Built-in behavior library
│   │   └── worker.ts         # Web Worker entry point
│   │
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema
│   │   ├── client.ts         # DB connection
│   │   └── queries.ts        # Common queries
│   │
│   └── utils/
│       └── ...
│
├── workers/
│   └── simulation.worker.ts  # Web Worker for Flocc runtime
│
└── types/
    └── index.ts              # Shared TypeScript types
```

### Model State Shape

```typescript
interface StudioModel {
  id: string;
  name: string;
  description: string;
  
  // Canvas/environment
  environment: {
    width: number;
    height: number;
    wraparound: boolean;
    terrain?: TerrainConfig;
  };
  
  // Agent definitions
  agentTypes: AgentType[];
  
  // Initial populations
  populations: Population[];
  
  // Global parameters (exposed as sliders)
  parameters: Parameter[];
  
  // Metadata
  tags: string[];
  thumbnail?: string;
  
  // Versioning
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface AgentType {
  id: string;
  name: string;
  color: string;
  shape: 'circle' | 'triangle' | 'square' | 'custom';
  size: number;
  
  // Properties with initial values/distributions
  properties: PropertyDef[];
  
  // Behaviors executed each tick
  behaviors: Behavior[];
}

interface Behavior {
  id: string;
  type: BehaviorType;  // 'move-toward', 'avoid', 'if-nearby', etc.
  params: Record<string, any>;
  enabled: boolean;
}

interface Population {
  agentTypeId: string;
  count: number;
  distribution: 'random' | 'grid' | 'cluster' | 'custom';
  region?: { x: number; y: number; width: number; height: number };
}

interface Parameter {
  id: string;
  name: string;
  type: 'number' | 'boolean' | 'choice';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}
```

### Built-in Behaviors (v1)

```typescript
const BEHAVIOR_LIBRARY = {
  // Movement
  'random-walk': { params: ['speed'] },
  'move-toward': { params: ['target', 'speed'] },  // target = agent type or point
  'move-away': { params: ['target', 'speed'] },
  'follow-gradient': { params: ['property', 'speed'] },
  
  // Interaction
  'if-nearby': { params: ['target', 'distance', 'then'] },  // conditional
  'on-collision': { params: ['target', 'action'] },
  'emit-signal': { params: ['name', 'strength', 'decay'] },
  
  // State changes
  'set-property': { params: ['property', 'value'] },
  'increment': { params: ['property', 'amount'] },
  'change-type': { params: ['newType'] },  // metamorphosis
  'die': { params: [] },
  'reproduce': { params: ['probability'] },
  
  // Advanced
  'custom-code': { params: ['code'] },  // escape hatch to JS
};
```

---

## Backend Architecture

### Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Runtime | **Next.js API Routes** | No separate backend, unified deployment |
| Database | **Vercel Postgres** or **Neon** | Managed Postgres, serverless-friendly |
| ORM | **Drizzle** | Lightweight, type-safe, great DX |
| Auth | **NextAuth.js (Auth.js)** | De facto React auth, GitHub/Google OAuth |
| File Storage | **Vercel Blob** or **Cloudflare R2** | Thumbnails, exports |
| Hosting | **Vercel** | Zero-config Next.js deployment |

### Why Vercel

- Git push deploys
- Preview deployments for PRs
- Edge network for static assets
- Integrated Postgres, Blob storage, Analytics
- Generous free tier (hobby), $20/month pro tier

### API Routes (Next.js App Router)

```
/api/auth/[...nextauth]         # NextAuth.js (login, callback, session)

GET    /api/models              # List models (paginated, filterable)
POST   /api/models              # Create model

GET    /api/models/[id]         # Get model
PUT    /api/models/[id]         # Update model (owner only)
DELETE /api/models/[id]         # Delete model (owner only)

POST   /api/models/[id]/fork    # Fork model
GET    /api/models/[id]/versions # Version history
POST   /api/models/[id]/versions # Save new version

GET    /api/users/[username]           # Public profile
GET    /api/users/[username]/models    # User's public models

POST   /api/export/[id]         # Generate standalone HTML/JS export
POST   /api/thumbnail/[id]      # Generate/update thumbnail (Vercel Blob)
```

All routes use `auth()` from NextAuth to get the current session. Protected routes return 401 if not authenticated, 403 if not authorized.

### Database Schema (Drizzle)

```typescript
// src/lib/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, jsonb, primaryKey } from 'drizzle-orm/pg-core';

// NextAuth.js required tables
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  username: text('username').unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const accounts = pgTable('accounts', {
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
}, (account) => ({
  pk: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable('sessions', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// Application tables
export const models = pgTable('models', {
  id: text('id').primaryKey(),              // nanoid
  slug: text('slug').unique(),              // URL-friendly name
  userId: text('user_id').references(() => users.id),
  
  name: text('name').notNull(),
  description: text('description'),
  definition: jsonb('definition').notNull(), // StudioModel object
  
  isPublic: boolean('is_public').default(false),
  isFeatured: boolean('is_featured').default(false),
  
  thumbnailUrl: text('thumbnail_url'),
  
  forkOf: text('fork_of').references((): any => models.id),
  forkCount: integer('fork_count').default(0),
  viewCount: integer('view_count').default(0),
  
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const modelVersions = pgTable('model_versions', {
  id: text('id').primaryKey(),
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(),
  definition: jsonb('definition').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').unique().notNull(),
});

export const modelTags = pgTable('model_tags', {
  modelId: text('model_id').notNull().references(() => models.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.modelId, t.tagId] }),
}));
```

### Authentication Flow

Using NextAuth.js with GitHub OAuth (simplest for developer-focused audience):

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/client';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    // Add Google later for non-developers
  ],
});

export const { GET, POST } = handlers;
```

NextAuth handles the full OAuth flow, session management, and CSRF protection. The Drizzle adapter persists users and sessions to Postgres.

---

## Simulation Runtime

### Web Worker Architecture

Run simulations in a Web Worker to keep UI responsive:

```
┌─────────────────┐         ┌─────────────────┐
│   Main Thread   │         │   Web Worker    │
│                 │         │                 │
│  UI Components  │◄───────►│  Flocc Engine   │
│  Canvas Render  │  postMsg│  Model State    │
│  User Input     │         │  Tick Loop      │
└─────────────────┘         └─────────────────┘
```

Messages:

```typescript
// Main → Worker
type ToWorker =
  | { type: 'init'; model: StudioModel }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'step' }
  | { type: 'reset' }
  | { type: 'set-param'; id: string; value: any }
  | { type: 'set-speed'; ticksPerFrame: number };

// Worker → Main
type FromWorker =
  | { type: 'state'; tick: number; agents: AgentSnapshot[] }
  | { type: 'metrics'; data: Record<string, number> }
  | { type: 'error'; message: string };
```

### Compilation Pipeline

```
StudioModel (JSON)
       │
       ▼
┌─────────────────┐
│    Compiler     │  Convert visual model to Flocc code
└─────────────────┘
       │
       ▼
  Flocc Code (JS)
       │
       ▼
┌─────────────────┐
│  Web Worker     │  Execute in isolated context
│  + Flocc Core   │
└─────────────────┘
       │
       ▼
  Agent States (per tick)
```

The compiler generates something like:

```javascript
import { Environment, Agent } from 'flocc';

const env = new Environment({ width: 800, height: 600 });

// Agent type: Boid
function createBoid() {
  const agent = new Agent();
  agent.set('speed', 2);
  agent.set('vision', 50);
  
  agent.addRule((a) => {
    // Compiled behavior: flock
    const neighbors = env.getAgents().filter(/* ... */);
    // ... alignment, cohesion, separation ...
  });
  
  return agent;
}

// Populate
for (let i = 0; i < 100; i++) {
  env.addAgent(createBoid());
}

// Expose for worker
self.env = env;
```

---

## Infrastructure

### Development

```
Local:
├── App:      localhost:3000 (Next.js dev server)
├── Database: localhost:5432 (Postgres via Docker, or Neon free tier)
└── Storage:  Local filesystem (or Vercel Blob in dev mode)
```

### Production

```
Vercel:
├── App:       flocc.studio (Next.js on Vercel)
├── Database:  Vercel Postgres (or Neon)
├── Storage:   Vercel Blob
├── Analytics: Vercel Analytics (optional)
└── Domain:    flocc.studio
```

Estimated monthly cost at launch: **$0-20/month**
- Hobby tier: Free (good for launch)
- Pro tier: $20/month (more builds, bandwidth, team features)

### Scaling Path

If it grows:
1. Upgrade Vercel Postgres tier
2. Add Vercel KV (Redis) for caching if needed
3. Consider ISR (Incremental Static Regeneration) for model pages
4. Edge functions for latency-sensitive operations

---

## Implementation Phases

### Phase 1: Core Editor (4-6 weeks)

- [ ] Project setup (SvelteKit, Tailwind, basic API)
- [ ] Model state management with undo/redo
- [ ] Agent type editor (name, color, shape, properties)
- [ ] Basic behavior builder (random walk, move toward, if-nearby)
- [ ] Canvas renderer (wrap Flocc's CanvasRenderer)
- [ ] Play/pause/step controls
- [ ] Local storage for anonymous saves

### Phase 2: Persistence (2-3 weeks)

- [ ] Database setup (Postgres, Drizzle)
- [ ] GitHub OAuth authentication
- [ ] Save/load models to database
- [ ] Public/private model visibility
- [ ] User profile pages

### Phase 3: Sharing & Discovery (2-3 weeks)

- [ ] Model gallery with search/filter
- [ ] Fork functionality
- [ ] Embed code generation
- [ ] Thumbnail generation (canvas snapshot)
- [ ] Featured models curation

### Phase 4: Polish & Launch (2-3 weeks)

- [ ] Documentation / help system
- [ ] 10-15 example models (classics)
- [ ] Performance optimization
- [ ] Mobile-friendly adjustments
- [ ] Landing page
- [ ] Soft launch, feedback collection

---

## Open Questions

1. **Domain**: `flocc.studio`? `studio.flocc.net`? Something else?

2. **Code escape hatch**: How much JS access in visual mode? Full custom behaviors, or limited expressions?

3. **Collaboration**: Real-time multiplayer editing? (Complex, probably v2)

4. **Data export**: CSV download of simulation data? Charts/graphs built-in?

5. **LLM integration**: "Describe a model in natural language, generate it"? Could be a killer feature but adds complexity.

---

## References

- [NetLogo Web](https://www.netlogoweb.org/) — Inspiration for browser-based ABM
- [Scratch](https://scratch.mit.edu/) — Block-based programming UX
- [Observable](https://observablehq.com/) — Notebook-style sharing model
- [Excalidraw](https://excalidraw.com/) — Good example of local-first + cloud sync
- [Val Town](https://val.town/) — Lightweight code sharing with instant URLs
