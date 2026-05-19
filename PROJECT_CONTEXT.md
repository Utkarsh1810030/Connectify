# Connectify — Project Context & Knowledge Base

> This file serves as persistent context for AI-assisted development. Update periodically to maintain continuity across sessions.

**Last Updated:** 2026-05-19

---

## 1. Product Vision

**Connectify** is a paid companionship marketplace that tackles loneliness by connecting users with providers (companions) through chat, voice calls, and video calls. Users pay per-minute based on provider-set rates. The platform takes a configurable commission.

### Core Value Proposition
- Users get on-demand human connection (emotional support, career advice, language practice, hobby chats)
- Providers monetize their time and conversational skills
- Platform earns via commission on every transaction

### Target Market
- India-first (urban, 18-35 age group)
- Initial launch: 500–1000 users
- Scalable to lakhs without code rewrite

---

## 2. Business Model

| Revenue Stream | Mechanism |
|---------------|-----------|
| Platform commission | 15% default (configurable per provider) on every session |
| Wallet top-up | Users add money via Razorpay (no fee to platform, Razorpay charges 2%) |
| Premium listings | Future: providers pay for visibility (not in MVP) |

### Pricing Model
- Providers set their own rates for chat/voice/video (in INR per minute)
- Higher-rated providers can charge more
- Users pay per-minute, deducted from wallet in real-time

---

## 3. Technical Decisions

### Stack
| Layer | Technology | Reason |
|-------|-----------|--------|
| Backend | Node.js + NestJS | Modular architecture, DI, scalable patterns built-in |
| Mobile | React Native (Expo) | Single codebase iOS+Android, fast iteration |
| Web | Next.js (App Router) | SSR for marketing, CSR for app, admin panel |
| DB (core) | PostgreSQL | Transactional integrity for billing, relational data |
| DB (chat) | MongoDB | Flexible schema, optimized for message storage/retrieval |
| Real-time chat | Socket.io | Handles 1K concurrent on single server easily |
| Caching | Redis | Session state, wallet cache, rate limiting, feature flags, billing timers |
| Voice/Video | Agora SDK | Pay-per-minute, no self-hosting, handles scaling |
| Payments | Razorpay | Best Indian integration, wallet + per-minute billing |
| Monorepo | Turborepo + pnpm | Shared types, single CI, efficient builds |
| Deployment | Docker + docker-compose | Same containers on VPS today, K8s tomorrow |
| CI/CD | GitHub Actions | Free for public repos, integrated with GitHub Projects |
| Tickets | GitHub Issues + Projects | Agile workflow: Epics → Stories → Tasks |

### Architecture Principles
1. **Modular monolith** — logically separated services in one deployment (microservices-ready)
2. **Event-driven** — all cross-module communication via event bus (in-memory now, Kafka later)
3. **Repository pattern** — DB abstraction for testability and future migration
4. **Feature flags** — scale features coded but disabled until needed
5. **Interface-based DI** — swap implementations (cache, queue, event bus) without code changes

---

## 4. Scale-Ready Strategy

### Currently Active (MVP, 500–1000 users)
- EventEmitter2 (in-process event bus)
- Redis (caching: session state, wallet balances, feature flags, provider online status, rate limiting)
- setTimeout/setInterval (job scheduling)
- Single PostgreSQL + MongoDB + Redis instance on VPS
- Billing timers in Redis (supports distributed timers from day one)

### Coded but Feature-Flagged (enable at scale)
- Kafka event bus adapter
- Redis Cluster (multi-node, sharded)
- Bull queue adapter (Redis-backed)
- AI moderation (image/audio analysis)
- Audio transcription for phone number detection
- ML-based evasion pattern detection
- Read replicas + PgBouncer connection pooling

### Upgrade Path
```
500 users    → Single VPS (₹2-3K/mo), in-memory everything
5,000 users  → Managed DB (Supabase/Neon), add Redis
50,000 users → Kubernetes, Kafka, Redis cluster, CDN
500,000+     → Multi-region, DB sharding, self-hosted media servers
```

---

## 5. Infrastructure & Costs (MVP)

| Component | Choice | Cost |
|-----------|--------|------|
| Server | Hetzner CX31 (4vCPU, 8GB) | ₹2-3K/mo |
| Database | PostgreSQL + MongoDB + Redis on VPS | ₹0 |
| Voice/Video | Agora (10K min/mo free) | ₹0-5K/mo |
| Storage | Cloudflare R2 (10GB free) | ₹0 |
| Payments | Razorpay (2% per txn only) | ₹0 fixed |
| OTP/SMS | MSG91 | ₹500-1K/mo |
| Domain + SSL | Cloudflare | ₹1K/year |
| Monitoring | Grafana Cloud free + Sentry | ₹0 |
| **Total** | | **₹5-10K/month** |

---

## 6. Key Challenges & Solutions

### Anti-Disintermediation (users bypassing platform)
- Regex + NLP filter in chat (phone numbers, social handles, leet speak)
- Image OCR for screenshots with contact info (feature-flagged)
- Audio transcription sampling on calls (feature-flagged)
- Masked calling (Agora — users never see real numbers)
- No chat outside paid sessions
- Economic disincentives: ratings, guaranteed payouts, safety

### Content Moderation
- Keyword filter (active from day 1)
- Report mechanism with manual review
- AI image/audio moderation (coded, feature-flagged)
- Three-strike policy: warn → temp ban → permanent ban
- Appropriateness sub-rating from users

### Regulatory Compliance (India)
- IT Act Section 79 safe harbor (intermediary guidelines)
- Grievance Officer + Nodal Contact + Chief Compliance Officer
- Age gate (18+ via Aadhaar-based verification)
- KYC for providers (Aadhaar/PAN via Digio)
- Clear ToS distinguishing companionship from adult content

---

## 7. Database Schema Summary

### PostgreSQL (12 tables)
- `users` — core user account (phone, role, verified, banned)
- `provider_profiles` — rates, categories, languages, ratings, commission
- `wallets` — balance per user
- `transactions` — all money movements (topup, debit, earning, payout, refund)
- `sessions` — call/chat session lifecycle with billing data
- `ratings` — post-session scores (overall, helpfulness, appropriateness)
- `payouts` — provider withdrawal requests
- `feature_flags` — runtime feature toggles
- `moderation_logs` — all moderation actions
- `platform_config` — key-value runtime settings
- `reports` — user-submitted reports
- `provider_availability` — schedule/availability slots

### MongoDB (2 collections)
- `conversations` — session-linked conversation metadata
- `messages` — individual messages with moderation flags

---

## 8. Agile Plan

### 5 Epics (~109 story points, ~12 weeks)

| Epic | Stories | SP | Sprint |
|------|---------|-----|--------|
| 1. Auth & User Management | 6 | 21 | Sprint 1 |
| 2. Wallet & Billing | 5 | 21 | Sprint 2 |
| 3. Chat System | 5 | 18 | Sprint 3 |
| 4. Voice & Video Calling | 5 | 26 | Sprint 4 |
| 5. Ratings, Moderation & Admin | 5 | 23 | Sprint 5 |

### Implementation Order
1. Week 1: Scaffold monorepo, Docker, CI, DB migrations
2. Week 2-3: Auth + user/provider CRUD + wallet (Epic 1 + start Epic 2)
3. Week 4-5: Billing engine + Razorpay (Epic 2)
4. Week 6-7: Chat with moderation (Epic 3)
5. Week 8-9: Voice/Video with Agora (Epic 4)
6. Week 10-11: Ratings + admin panel (Epic 5)
7. Week 12: Testing, deployment, soft launch

---

## 9. Monorepo Structure

```
connectify/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml           (allowBuilds: @nestjs/core, unrs-resolver)
├── docker-compose.yml
├── .github/workflows/ci.yml
├── apps/
│   ├── api/          (NestJS backend — fully scaffolded, smoke-tested)
│   ├── mobile/       (React Native Expo — scaffolded, UI stubs)
│   └── web/          (Next.js — scaffolded, all routes working, 26 unit tests pass)
├── packages/
│   ├── types/        (shared TypeScript types)
│   ├── config/       (env schemas, constants)
│   ├── utils/        (shared utilities)
│   ├── ui/           (shared UI — react-native-web compatible)
│   ├── api-client/   (typed API client for mobile + web)
│   └── eslint-config/
└── docs/
```

---

## 10. Known Infrastructure Quirks (CRITICAL — saves hours of debugging)

### macOS + Docker PostgreSQL ECONNREFUSED
- macOS resolves `localhost` → `::1` (IPv6); Docker Postgres binds `127.0.0.1` only
- **Fix:** Use `127.0.0.1` not `localhost` in `DATABASE_URL`
- `DATABASE_URL=postgresql://connectify:connectify_dev@127.0.0.1:5432/connectify`

### MongoDB Docker Replica Set Topology Hang
- Docker replica set advertises internal hostname `mongo:27017`
- Mongoose from host machine hangs forever trying to resolve `mongo` hostname
- **Fix:** Add `directConnection=true` to MONGODB_URI
- `MONGODB_URI=mongodb://localhost:27017/connectify?directConnection=true`

### TypeORM nullable string columns
- Must use explicit `type: 'varchar'`: `@Column({ type: 'varchar', nullable: true })`
- Without `type`, nullable strings fail during migration

### TypeORM createQueryBuilder + relations
- `leftJoinAndSelect` can fail with `databaseName undefined` on certain entity metadata setups
- **Fix:** Use `findAndCount` with `relations: ['user']` instead

### pnpm allowBuilds
- `@nestjs/core` and `unrs-resolver` require explicit build permission in `pnpm-workspace.yaml`

---

## 11. Next.js App Router Routing Rules

- Route groups `(app)`, `(admin)`, `(marketing)` are **stripped from URLs**
- `href="/(app)/home"` → 404 (wrong)
- `href="/home"` → correct
- `redirect('/(app)/home')` → 404 (wrong); use `redirect('/home')`
- All internal links must use the public URL path, never the filesystem path

---

## 12. API: Known Issues Fixed

| Endpoint | Issue | Fix |
|----------|-------|-----|
| `GET /api/v1/health` | 404 — no controller | Created `app.controller.ts`, registered in `app.module.ts` |
| `POST /api/v1/auth/request-otp` | Rejected E.164 `+91XXXXXXXXXX` | DTO regex: `^(\+?91)?[6-9]\d{9}$` |
| `GET /api/v1/providers` | 500 — `skip` string type | Parse query params with `parseInt()` in controller |
| `GET /api/v1/providers` | 500 — `databaseName undefined` | Replace `createQueryBuilder` with `findAndCount` |

---

## 13. Web App: Current State

### Routes Working (all 404s resolved)
- `/` — Landing page (marketing)
- `/pricing` — Pricing page (2 tiers + FAQ)
- `/home` — Provider listing (requires auth in future)
- `/provider/[id]` — Provider detail
- `/wallet` — Wallet management
- `/provider/dashboard`, `/provider/earnings`, `/provider/settings` — Provider dashboard
- `/admin/users`, `/admin/payouts`, `/admin/moderation` — Admin panel

### Unit Tests (26 passing, 5 suites)
| Suite | Tests |
|-------|-------|
| `landing-page.test.tsx` | 8 — all nav/CTA link hrefs, route-group leak detection |
| `app-layout.test.tsx` | 5 — sidebar hrefs, no `/(app)/` leaks |
| `admin-layout.test.tsx` | 5 — admin sidebar hrefs |
| `home-page.test.tsx` | 5 — heading, empty state, loading, provider cards, link hrefs |
| `pricing-page.test.tsx` | 3 — module exists, renders, has h1 |

### Jest Config
- Key file: `apps/web/jest.config.js`
- **Must use `setupFilesAfterEnv`** (not `setupFilesAfterFramework` — that key doesn't exist)
- `moduleNameMapper` needed for `@/` alias and `@connectify/*` packages

### Mock Pattern for TanStack Query
```typescript
// CORRECT — extract as jest.fn() to enable mockReturnValue per test
const mockUseQuery = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));
// In tests:
mockUseQuery.mockReturnValue({ data: ..., isLoading: false });
```

---

## 14. Mobile App: Current State

### Scaffolded (UI stubs only)
- Auth: `/app/(auth)/login.tsx`, `/app/(auth)/onboarding.tsx`
- Tabs: home, search, history, profile
- Sessions: chat, voice, video screens
- Modals: top-up, rate, report

### Key Files
- `src/services/api.ts` — Axios client with JWT refresh interceptor (SecureStore)
- `src/services/socket.ts` — SocketService managing `/chat` and `/session` namespaces
- `src/stores/auth.store.ts` — Zustand auth store with SecureStore hydration

### Known TypeScript Issues Fixed
- `transports: ['websocket'] as string[]` — not `as const` (makes array readonly, breaks socket.io types)
- StyleSheet must define all referenced style keys (`theirs: { alignSelf: 'flex-start' }`)

---

## 15. Implementation Progress

### Completed
- [x] Product vision & business model defined
- [x] Tech stack finalized
- [x] System architecture designed
- [x] Database schema designed
- [x] Agile epics & stories planned
- [x] Monorepo scaffolded (Turborepo + pnpm)
- [x] NestJS backend — all 11 modules, TypeORM entities, migrations, guards, interceptors
- [x] Docker setup (dev)
- [x] GitHub Actions CI pipeline
- [x] API smoke-tested (health, auth, providers all working)
- [x] React Native Expo mobile — scaffolded, navigation, stores, services
- [x] Next.js web — all routes working, 26 unit tests passing
- [x] All 404 bugs fixed (route groups, missing pricing page, bad redirects)

### Pending
- [ ] GitHub Issues creation (Epics + Stories)
- [ ] Web: `/login` page (auth flow not connected)
- [ ] Web: `/session/[id]` page not built
- [ ] Web: `/admin/sessions` page not built
- [ ] Mobile: zero unit test coverage
- [ ] Agora RTC — voice/video screens are UI stubs only
- [ ] Razorpay — `createOrder` works, SDK payment sheet not wired
- [ ] E2E tests — Playwright (web) / Detox (mobile) not set up
- [ ] `docker-compose.prod.yml` not created

---

## 16. Session Log

### Session 1 (2026-05-18)
- Discussed product concept, evaluated India market feasibility
- Designed anti-disintermediation strategy
- Estimated infrastructure costs for all growth phases
- Decided on "scale-ready code, starter infra" approach
- Finalized tech stack, designed full system architecture
- Created agile breakdown (5 epics, 109 SP)

### Session 2 (2026-05-18 → 2026-05-19)
- Scaffolded full Turborepo monorepo
- Built NestJS backend with all 11 modules
- Fixed MongoDB + PostgreSQL local dev connection issues (see Section 10)
- Scaffolded React Native Expo mobile app
- Scaffolded Next.js web app
- Fixed all 404 routes (route group leaks, missing pricing page)
- Wrote 26 unit tests (TDD: red → green) for web app
- All `turbo typecheck` passing (9/9 packages)
- **Next:** Create GitHub Issues for epics, wire auth flow, build missing pages
