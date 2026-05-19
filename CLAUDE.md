# Connectify — Claude Agent Instructions

## Session Start Protocol (MANDATORY)

**Before doing any work**, read `PROJECT_CONTEXT.md` to understand current implementation state:

```bash
cat PROJECT_CONTEXT.md
```

Then check `.claude/knowledge-graph.md` for the dependency/import graph to navigate the codebase without scanning every file.

## Post-Implementation Protocol (MANDATORY)

**After implementing any feature**, update `PROJECT_CONTEXT.md`:
1. Move completed items from `### Pending` to `### Completed`
2. Add any new pending items discovered
3. Update the `**Last Updated:**` date at the top

## Project Overview

**Connectify** — paid companionship marketplace. Users pay per-minute for chat/voice/video with providers. Platform takes 15% commission.

**Monorepo:** `apps/api` (NestJS) + `apps/mobile` (Expo RN) + `apps/web` (Next.js) + `packages/types|config|utils|ui`

## Environment Setup

```bash
# Required — pnpm requires Node ≥ v22.13
nvm use 22.13.0

# Install deps
pnpm install

# Start local infra
docker-compose up -d

# Run all services
turbo run dev
```

## Critical Infrastructure Quirks

### macOS Docker: Always use 127.0.0.1 (NEVER `localhost`)
macOS resolves `localhost` → `::1` (IPv6); Docker binds IPv4 only.
```
DATABASE_URL=postgresql://connectify:connectify_dev@127.0.0.1:5432/connectify
REDIS_URL=redis://127.0.0.1:6379
MONGODB_URI=mongodb://127.0.0.1:27017/connectify?directConnection=true
```

### MongoDB replica set: add `directConnection=true`
Without it, Mongoose hangs resolving Docker internal hostname `mongo:27017`.

### TypeORM nullable strings: explicit type required
```typescript
@Column({ type: 'varchar', nullable: true })  // correct
@Column({ nullable: true })                   // fails migrations
```

## Testing Protocol

Run before every commit:

```bash
# API tests (105 tests)
cd apps/api && nvm use 22.13.0 && npx jest --no-coverage

# Web tests (74 tests)
cd apps/web && npx jest --no-coverage

# All packages
nvm use 22.13.0 && turbo run test
```

## API Module Structure

```
apps/api/src/modules/
├── auth/          JWT (access 15m + refresh 7d), phone OTP login
├── users/         CRUD, FCM token registration
├── providers/     Profiles, categories, weighted ranking, KYC
├── sessions/      Lifecycle (pending→active→paused→completed), pause/resume
├── billing/       Wallet, per-minute engine, Razorpay (dev bypass when keys empty)
├── chat/          Socket.io /chat namespace, MongoDB messages
├── calling/       Agora token server
├── ratings/       Post-session scores
├── moderation/    Keyword filter, reports, disintermediation
├── notifications/ FCM push (firebase-admin, dev → console.log)
└── admin/         Users, payouts, KYC review, provider approval
```

## Key DI Tokens

- `CACHE_SERVICE` — injected as `@Inject(CACHE_SERVICE)`
- `EVENT_BUS` — injected as `@Inject(EVENT_BUS)`
- `FIREBASE_APP` — injected as `@Inject(FIREBASE_APP)`, may be `null` in dev
- `DataSource` — TypeORM DataSource class used directly as DI token

## Next.js Route Groups

Route groups (`(app)`, `(admin)`, `(provider)`, `(marketing)`) are **stripped from URLs**.
- `href="/(app)/home"` → 404 (wrong)
- `href="/home"` → correct

## Jest Module Name Mapper (API)

`rootDir` = `apps/api/src` → packages are 3 levels up:
```js
'@connectify/(.*)': '<rootDir>/../../../packages/$1/src'
```

## Knowledge Graph

The knowledge graph is maintained at `.claude/knowledge-graph.md`. Run the `knowledge-graph` agent to regenerate after significant structural changes:

```
subagent_type: knowledge-graph
path: /Users/utkarshc/Desktop/connectify
```
