# Connectify — Knowledge Graph

**Scan mode:** full
**Commit:** 908368e
**Timestamp:** 2026-05-19T00:00:00Z
**Files scanned:** 166
**Modules detected:** 6

Structured JSON files live in `.claude/knowledge-graph/`:
- `meta.json` — scan metadata and freshness check
- `summary.json` — module-level graph with edges and circular dep info
- `externals.json` — third-party dependency map
- `modules/api.json`, `modules/web.json`, `modules/mobile.json`, `modules/types.json`, `modules/config.json`, `modules/utils.json` — per-module file-level detail

---

## Language Breakdown

| Language   | Files | Percentage |
|------------|-------|------------|
| TypeScript | 163   | 98%        |
| JavaScript | 3     | 2%         |

---

## Repo Structure

```
connectify/                          # pnpm workspace root
├── apps/
│   ├── api/                         # NestJS REST + WebSocket backend
│   ├── web/                         # Next.js 14 App Router frontend
│   └── mobile/                      # Expo Router v3 React Native app
└── packages/
    ├── types/                       # Shared TypeScript interfaces (no runtime deps)
    ├── config/                      # Zod-validated env config schema
    ├── utils/                       # Pure utility functions (money, phone, pagination, date)
    ├── ui/                          # (placeholder, no tracked files)
    └── api-client/                  # (placeholder, no tracked files)
```

---

## Module Dependency Map

| Module | Files | External deps (key)                                    | Depends on          | Depended on by    |
|--------|-------|--------------------------------------------------------|---------------------|-------------------|
| api    | 90    | @nestjs/*, typeorm, mongoose, ioredis, socket.io, agora-token, razorpay, firebase-admin | types, config, utils | —        |
| web    | 39    | next, react, axios, socket.io-client, @tanstack/react-query, zustand | types, utils   | —            |
| mobile | 26    | expo, expo-router, react-native, react-native-agora, axios, socket.io-client, @tanstack/react-query, zustand | types, utils | — |
| types  | 8     | —                                                      | —                   | api, web, mobile  |
| config | 1     | zod                                                    | —                   | api               |
| utils  | 5     | —                                                      | —                   | api, web, mobile  |

---

## Circular Dependencies

WARNING: `api/sessions` <-> `api/calling`

Both `SessionsModule` and `CallingModule` import each other. NestJS `forwardRef()` is used in both module imports and service injection to resolve this.

- `apps/api/src/modules/sessions/sessions.module.ts` imports `CallingModule` with `forwardRef`
- `apps/api/src/modules/calling/calling.module.ts` imports `SessionsModule` with `forwardRef`
- `apps/api/src/modules/sessions/sessions.service.ts` injects `CallingService` with `@Inject(forwardRef(...))`

---

## Entry Points

| File                               | Module | Role                              |
|------------------------------------|--------|-----------------------------------|
| `apps/api/src/main.ts`             | api    | NestJS bootstrap, HTTP + WS server on port 3000 |
| `apps/web/src/app/layout.tsx`      | web    | Next.js root layout, wraps React Query provider |
| `apps/mobile/app/_layout.tsx`      | mobile | Expo Router root layout, initialises auth + query client |

---

## API Module Internal Dependency Graph

### Infrastructure layer (global — auto-injected everywhere via `InfrastructureModule`)

```
InfrastructureModule (@Global)
├── CacheModule          → RedisCacheService  (token: CACHE_SERVICE)
├── EventBusModule       → LocalEventBus      (token: EVENT_BUS)
└── FeatureFlagsModule   → FeatureFlagsService (depends on CacheModule)
```

**DI Tokens:**
- `CACHE_SERVICE` — `ICacheService` backed by `RedisCacheService` (ioredis)
- `EVENT_BUS` — `IEventBus` backed by `LocalEventBus` (eventemitter2)
- `FIREBASE_APP` — provided by `NotificationsModule`, may be `null` in dev

### NestJS module dependency tree

```
AppModule
├── InfrastructureModule (global)
├── GatewaysModule
│   ├── ChatModule (re-export)
│   ├── SessionsModule (re-export)
│   └── ProvidersModule (re-export)
├── AuthModule
│   └── UsersModule
├── UsersModule
├── ProvidersModule
├── SessionsModule
│   ├── BillingModule
│   ├── ProvidersModule
│   └── CallingModule ←→ (circular, forwardRef)
├── BillingModule
├── ChatModule
│   ├── ModerationModule
│   └── SessionsModule
├── CallingModule ←→ (circular with SessionsModule)
├── RatingsModule
│   ├── ProvidersModule
│   └── SessionsModule
├── ModerationModule
├── NotificationsModule
└── AdminModule
    ├── UsersModule
    ├── ProvidersModule
    ├── SessionsModule
    ├── ModerationModule
    ├── BillingModule
    └── NotificationsModule
```

### Service dependency summary (which services call which)

| Service              | Calls                                                           |
|----------------------|-----------------------------------------------------------------|
| AuthService          | UsersService, ICacheService                                     |
| UsersService         | (TypeORM only)                                                  |
| ProvidersService     | ICacheService                                                   |
| SessionsService      | ProvidersService, BillingEngineService, WalletService, CallingService, IEventBus, ICacheService |
| BillingEngineService | WalletService, IEventBus, ICacheService                         |
| WalletService        | ICacheService, (TypeORM + DataSource for transactions)          |
| RazorpayService      | WalletService                                                   |
| CallingService       | ICacheService                                                   |
| ChatService          | ModerationService                                               |
| ModerationService    | ContentFilterService, IEventBus                                 |
| RatingsService       | ProvidersService, SessionsService                               |
| AdminService         | UsersService, ProvidersService, SessionsService, ModerationService, NotificationsService |
| NotificationsService | firebase-admin (or console.log in dev)                          |

### WebSocket gateways

| Gateway         | Namespace | Auth        | Depends on            |
|-----------------|-----------|-------------|-----------------------|
| ChatGateway     | /chat     | WsJwtGuard  | ChatService           |
| SessionGateway  | /session  | (none listed) | SessionsService, IEventBus |
| PresenceGateway | /presence | (none listed) | ProvidersService      |

---

## Web (Next.js) Module Detail

### Path alias
`@/*` resolves to `apps/web/src/*`

### Route group layout

```
src/app/
├── layout.tsx                      # Root layout (wraps Providers)
├── page.tsx                        # / — Landing page
├── login/page.tsx                  # /login
├── pricing/page.tsx                # /pricing
├── (app)/                          # Authenticated user routes
│   ├── layout.tsx                  # /... (auth guard)
│   ├── home/page.tsx               # /home
│   ├── provider/[id]/page.tsx      # /provider/:id
│   ├── session/[id]/page.tsx       # /session/:id (chat UI + socket)
│   └── wallet/page.tsx             # /wallet
├── (provider)/                     # Provider-role routes
│   ├── layout.tsx                  # (auth + role guard)
│   ├── dashboard/page.tsx          # /dashboard
│   ├── earnings/page.tsx           # /earnings
│   └── settings/page.tsx          # /settings
└── (admin)/                        # Admin routes
    ├── layout.tsx
    └── admin/
        ├── users/page.tsx          # /admin/users
        ├── sessions/page.tsx       # /admin/sessions
        ├── moderation/page.tsx     # /admin/moderation
        └── payouts/page.tsx        # /admin/payouts
```

**Note:** Route group prefixes `(app)`, `(provider)`, `(admin)` are stripped from URLs. Do NOT use them in `href`.

### Shared lib files

| File               | Exports                               | Used by                         |
|--------------------|---------------------------------------|---------------------------------|
| `src/lib/api.ts`   | `api` (axios + auth interceptor)      | All page components             |
| `src/lib/socket.ts`| `createChatSocket`, `getUserIdFromToken` | `(app)/session/[id]/page.tsx` |
| `src/lib/query-client.ts` | `queryClient`                | `providers.tsx`                 |

---

## Mobile (Expo RN) Module Detail

### Path alias
`@/*` resolves to `apps/mobile/src/*`

### Screen / route structure

```
app/
├── _layout.tsx                     # Root layout (QueryClient + auth init)
├── index.tsx                       # Redirects → /(auth) or /(tabs)/home
├── (auth)/
│   ├── _layout.tsx                 # Auth stack (redirects if logged in)
│   ├── login.tsx                   # Phone OTP login
│   └── onboarding.tsx              # Profile setup after first login
├── (tabs)/
│   ├── _layout.tsx                 # Bottom tab bar
│   ├── home.tsx                    # Provider discovery list
│   ├── search.tsx                  # Provider search
│   ├── history.tsx                 # Session history
│   └── profile.tsx                 # User profile + wallet balance
├── (modals)/
│   ├── rate.tsx                    # Post-session rating modal
│   ├── report.tsx                  # Report user modal
│   └── topup.tsx                   # Wallet top-up modal
├── provider/[id].tsx               # Provider detail + start session
└── session/
    ├── chat/[id].tsx               # Chat session screen (socket.io)
    ├── video/[id].tsx              # Video session screen (Agora RTC)
    └── voice/[id].tsx              # Voice session screen (Agora RTC)
```

### Service and store files

| File                      | Exports                                   | Role                                         |
|---------------------------|-------------------------------------------|----------------------------------------------|
| `src/services/api.ts`     | `api`                                     | Axios instance, reads token from SecureStore, auto-injects Authorization header |
| `src/services/socket.ts`  | `socketService`                           | Singleton socket.io-client, auth via SecureStore token, typed Message events |
| `src/services/agora.ts`   | `agoraService`, `RtcSurfaceView`, `VideoSourceType` | Agora RTC engine wrapper, fetches token via `api` |
| `src/stores/auth.store.ts`| `useAuthStore`                            | Zustand: tokens, user, login/logout (also connects/disconnects socketService) |
| `src/stores/session.store.ts` | `useSessionStore`                     | Zustand: active session state, rate/end/pause |
| `src/stores/wallet.store.ts` | `useWalletStore`                       | Zustand: balance, fetch, optimistic update after topup |
| `src/lib/query-client.ts` | `queryClient`                             | Shared React Query client instance           |

---

## Shared Packages Detail

### `@connectify/types` (`packages/types/src/index.ts`)

All types are re-exported from the barrel. No runtime code — types only.

| Type / Interface     | Source file          | Key fields / variants                                         |
|----------------------|----------------------|---------------------------------------------------------------|
| `UserRole`           | user.types.ts        | `'user' \| 'provider' \| 'admin'`                            |
| `User`               | user.types.ts        | id, phone, name, avatarUrl, role, isVerified, isBanned        |
| `ProviderCategory`   | provider.types.ts    | emotional_support, career_advice, language_practice, hobby_chat, study_buddy, general |
| `ProviderProfile`    | provider.types.ts    | chatRatePerMin, voiceRatePerMin, videoRatePerMin, avgRating, commissionRate |
| `ProviderListItem`   | provider.types.ts    | Lighter version of ProviderProfile for list views             |
| `SessionType`        | session.types.ts     | `'chat' \| 'voice' \| 'video'`                               |
| `SessionStatus`      | session.types.ts     | pending, active, paused, completed, cancelled, failed         |
| `SessionEndReason`   | session.types.ts     | user_ended, provider_ended, low_balance, moderation, timeout, error |
| `Session`            | session.types.ts     | Full session with billing fields                              |
| `ActiveSessionState` | session.types.ts     | Redis-stored live session state (ratePerMin, lastBilledAt, etc.) |
| `Wallet`             | billing.types.ts     | userId, balance, currency                                     |
| `Transaction`        | billing.types.ts     | type, amount, balanceAfter, referenceType/Id                  |
| `Payout`             | billing.types.ts     | providerId, amount, status, bankReference                     |
| `BillingTickEvent`   | billing.types.ts     | Emitted every billing interval: sessionId, amount, durationSec |
| `Message`            | chat.types.ts        | conversationId, senderId, type, content, isFiltered           |
| `WsNewMessage`       | chat.types.ts        | WebSocket payload for new message events                      |
| `WsTyping`           | chat.types.ts        | WebSocket payload for typing indicator                        |
| `WsPresence`         | chat.types.ts        | WebSocket payload for presence updates                        |
| `ContentFilterResult`| moderation.types.ts  | isClean, matches[], filteredContent                           |
| `ModerationLog`      | moderation.types.ts  | sessionId, userId, type, actionTaken                          |
| `Report`             | moderation.types.ts  | reporterId, reportedUserId, status (open/reviewed/resolved/dismissed) |
| `AuthTokens`         | api.types.ts         | accessToken, refreshToken, expiresIn                          |
| `PaginatedResponse`  | api.types.ts         | data[], total, page, limit, hasNext                           |

### `@connectify/config` (`packages/config/src/index.ts`)

| Export              | Type                       | Description                                    |
|---------------------|----------------------------|------------------------------------------------|
| `AppConfigSchema`   | `z.ZodObject`              | Zod schema for all env vars                    |
| `AppConfig`         | `type`                     | Inferred TypeScript type from schema           |
| `validateConfig`    | `(Record<string,unknown>) => AppConfig` | Used as NestJS ConfigModule validate fn |

Key env var groups: DATABASE_URL, MONGODB_URI, REDIS_URL, JWT secrets, AGORA_APP_ID/CERTIFICATE, RAZORPAY keys, MSG91 keys, FIREBASE_SERVICE_ACCOUNT_JSON, PLATFORM_COMMISSION_RATE (default 0.15), feature flags.

### `@connectify/utils` (`packages/utils/src/index.ts`)

| Export               | Source             | Description                                             |
|----------------------|--------------------|---------------------------------------------------------|
| `roundMoney`         | money.utils.ts     | `(amount) => Math.round(amount * 100) / 100`            |
| `splitAmount`        | money.utils.ts     | Returns `{platformFee, providerEarning}` given total + commissionRate |
| `calcSessionCharge`  | money.utils.ts     | Charge for N seconds at per-minute rate                 |
| `buildPagination`    | pagination.utils.ts| Builds `PaginationMeta` from page/limit/total           |
| `getPaginationOffset`| pagination.utils.ts| Calculates SQL OFFSET from page + limit                 |
| `isValidIndianPhone` | phone.utils.ts     | Validates +91 format Indian mobile numbers              |
| `normalizePhone`     | phone.utils.ts     | Normalises phone to +91XXXXXXXXXX format                |

---

## Key Cross-Cutting Concerns

### Authentication flow
1. `POST /auth/request-otp` → `AuthService` generates 6-digit OTP, stores in Redis (`CACHE_SERVICE`) with 5 min TTL, sends via MSG91 (or console in dev)
2. `POST /auth/verify-otp` → verifies OTP from Redis, upserts `UserEntity`, returns `AuthTokens` (access 15m + refresh 7d JWT)
3. `JwtAuthGuard` (`@nestjs/passport` `AuthGuard('jwt')`) validates access token on all protected routes
4. `JwtStrategy` calls `UsersService.findById` on every request to get the current user
5. Mobile/Web: token stored in `SecureStore` (mobile) or `localStorage` via axios interceptor (web), sent as `Authorization: Bearer <token>`

### Billing engine
1. `SessionsService.startSession` validates provider is online + approved, checks wallet balance >= 1 min cost, creates `SessionEntity` (pending), calls `CallingService.createAgoraToken` (if voice/video), stores `ActiveSessionState` in Redis, emits `session.started` event
2. `BillingEngineService` has a `@Cron` job that every 30s finds active sessions in Redis, calls `WalletService.debitForSession`, emits `billing.tick` event, ends session if balance exhausted
3. `WalletService` uses TypeORM `DataSource` transactions for atomic wallet debit + transaction record creation
4. `SessionGateway` listens to `IEventBus` for `session.started/ended/billing.tick` and broadcasts to socket room `session:<id>`

### Content moderation
1. All chat messages pass through `ContentFilterService.filter` (keyword + regex detection for phone numbers, social handles)
2. If flagged, message is stored with `isFiltered=true` and `ModerationService.logAction` creates a `ModerationLogEntity`
3. Admin can review `ReportEntity` records and take action (warn/block/ban user)

### Agora calling
1. `CallingService.createAgoraToken` uses `agora-token` package with RTC builder, caches token in Redis
2. Token is stored in `ActiveSessionState.agoraToken` and returned to client via `SessionsService`
3. Mobile: `agoraService` (in `src/services/agora.ts`) wraps `react-native-agora` engine, fetches token from `api.get('/calling/token?sessionId=...')`

---

## Database Entities (PostgreSQL via TypeORM)

| Entity                  | File                                              | Key columns                                         |
|-------------------------|---------------------------------------------------|-----------------------------------------------------|
| UserEntity              | modules/users/entities/user.entity.ts             | id (uuid), phone (unique), role, isVerified, isBanned, fcmToken |
| ProviderProfileEntity   | modules/providers/entities/provider-profile.entity.ts | userId (FK→User), chatRatePerMin, voiceRatePerMin, videoRatePerMin, avgRating, isOnline, isApproved, commissionRate |
| SessionEntity           | modules/sessions/entities/session.entity.ts       | userId, providerId, type, status, ratePerMin, totalDurationSec, totalAmount, platformFee, providerEarning, agoraChannelId |
| WalletEntity            | modules/billing/entities/wallet.entity.ts         | userId (unique), balance, currency                  |
| TransactionEntity       | modules/billing/entities/transaction.entity.ts    | walletId, type, amount, balanceAfter, referenceType/Id |
| PayoutEntity            | modules/billing/entities/payout.entity.ts         | providerId, amount, status, bankReference, processedAt |
| RatingEntity            | modules/ratings/entities/rating.entity.ts         | sessionId, userId, providerId, score, comment       |
| ModerationLogEntity     | modules/moderation/entities/moderation-log.entity.ts | sessionId, userId, type, content, actionTaken    |
| ReportEntity            | modules/moderation/entities/report.entity.ts      | reporterId, reportedUserId, sessionId, reason, status |

## MongoDB Collections (Mongoose)

| Schema             | File                                          | Key fields                                   |
|--------------------|-----------------------------------------------|----------------------------------------------|
| Conversation       | modules/chat/schemas/conversation.schema.ts   | sessionId, participants [userId, userId], lastMessageAt |
| Message            | modules/chat/schemas/message.schema.ts        | conversationId, senderId, type, content, isFiltered, readAt |

---

## Test Files

| Module | Test files                                                              | Framework                    |
|--------|-------------------------------------------------------------------------|------------------------------|
| api    | `billing.controller.spec.ts`, `wallet.service.spec.ts`, `calling.controller.spec.ts`, `chat.controller.spec.ts`, `providers.controller.spec.ts`, `ratings.controller.spec.ts`, `ratings.service.spec.ts`, `sessions.controller.spec.ts` | Jest + @nestjs/testing |
| web    | `__tests__/*.test.tsx` (11 files)                                       | Jest + @testing-library/react |

---

## Regenerating This Graph

Run the `knowledge-graph` agent after significant structural changes:

```
subagent_type: knowledge-graph
path: /Users/utkarshc/Desktop/connectify
```

The agent checks `meta.json → lastCommitHash` against `git rev-parse HEAD`. If unchanged, it stops. If changed files exceed 50% of total files, it does a full re-scan; otherwise incremental.
