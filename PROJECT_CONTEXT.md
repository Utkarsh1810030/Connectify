# Connectify — Project Context & Knowledge Base

> This file serves as persistent context for AI-assisted development. Update periodically to maintain continuity across sessions.

**Last Updated:** 2026-05-18

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
├── pnpm-workspace.yaml
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/ci.yml
├── apps/
│   ├── api/          (NestJS backend)
│   ├── mobile/       (React Native Expo)
│   └── web/          (Next.js)
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

## 10. Implementation Progress

### Completed
- [x] Product vision & business model defined
- [x] Tech stack finalized
- [x] System architecture designed
- [x] Database schema designed
- [x] Agile epics & stories planned
- [x] Scale strategy documented

### In Progress
- [ ] Monorepo scaffolding (Turborepo + pnpm)
- [ ] NestJS backend skeleton
- [ ] Docker setup
- [ ] CI/CD pipeline
- [ ] GitHub Issues creation (Epics + Stories)

### Upcoming
- [ ] Epic 1: Auth & User Management
- [ ] Epic 2: Wallet & Billing
- [ ] Epic 3: Chat System
- [ ] Epic 4: Voice & Video Calling
- [ ] Epic 5: Ratings, Moderation & Admin

---

## 11. Session Log

### Session 1 (2026-05-18)
- Discussed product concept: paid companionship marketplace
- Evaluated India market feasibility (favorable with regulatory caveats)
- Designed anti-disintermediation strategy
- Estimated infrastructure costs for all growth phases
- Decided on "scale-ready code, starter infra" approach
- Finalized tech stack decisions
- Designed full system architecture
- Created agile breakdown (5 epics, 109 SP)
- **Next:** Scaffold monorepo and begin implementation
