# Kiddy Backend (Phase 2A)

Production-ready backend for **Kiddy** — a kids learning + parental-control platform.
Built with **NestJS + Prisma + Neon PostgreSQL**, custom JWT auth (Argon2), and a
provider-agnostic subscription/payment layer.

> Phase 1 (the React Native app + Android locking services) is untouched. This is a
> standalone backend that the app talks to over HTTP. There is no UI in this phase —
> the API is documented via Swagger so the kid-facing UI can be built on top.

## Stack

- **Node.js + NestJS 10** (TypeScript)
- **Prisma 5** ORM → **Neon PostgreSQL**
- **JWT** access + refresh tokens, **Argon2id** password hashing
- **@nestjs/throttler** rate limiting, **helmet**, secure **httpOnly cookies**
- **Swagger / OpenAPI** docs

No Firebase, no Supabase, no Google Auth — custom authentication only.

## Quick start

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL / DIRECT_URL from Neon + secrets
npm install
npm run prisma:generate
npm run prisma:migrate        # creates tables (dev)
npm run prisma:seed           # levels, achievements, activities, challenges, demo users
npm run start:dev
```

- API base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/docs`
- Health: `GET http://localhost:4000/api/health`

### Demo credentials (from seed)

| Role   | Email            | Password    |
| ------ | ---------------- | ----------- |
| Admin  | admin@kiddy.app  | `Admin123!` |
| Parent | demo@kiddy.app   | `Parent123!`|

## Architecture

```
src/
  main.ts                 # bootstrap, Swagger, global pipes/filters/interceptors
  app.module.ts           # wires every feature module
  config/                 # typed configuration + env validation
  prisma/                 # PrismaService (global)
  common/                 # decorators, guards (JWT/Roles), filters, interceptors, DTOs
  modules/
    auth/                 # register/login/logout/refresh, reset, verify, sessions
    subscriptions/        # trial logic + payment abstraction (PaymentProvider)
    users/                # parent profile CRUD
    children/             # child profiles + ownership guard
    activities/           # DB-driven activities + attempts (reward orchestrator)
    stars/                # star ledger (signed transactions, never mutate balance)
    unlocks/              # spend stars -> app time + usage history
    xp/                   # XP awards + 1..100 level curve + level history
    streaks/              # daily streaks + milestones (3/7/14/30/60/90)
    achievements/         # dynamic achievement engine
    challenges/           # daily/weekly challenges + progress + claim
    analytics/            # events, daily metrics, DAU/WAU, completion rates
    audit/                # audit log writer + reader
    mail/                 # email architecture (console provider by default)
```

### Reward flow (single source of truth)

Completing an activity (`POST /children/:childId/attempts/:attemptId/complete`) runs
one orchestrated flow:

1. Reward = activity reward × (score / 100)
2. **Stars** credited via the ledger (`StarsService.earn`) — balances are *only* ever
   changed by writing a signed `StarTransaction` row inside a transaction.
3. **XP** awarded (`XpService.award`) → recomputes level, writes `LevelHistory`.
4. **Streak** for the UTC day registered → milestone detection.
5. **Challenges** progressed (`activities`, `stars`, `xp` metrics).
6. **Achievements** re-evaluated and auto-rewarded.
7. **Analytics** events tracked + rolled into daily metrics.

### Authentication

- Access token: short-lived JWT in `Authorization: Bearer <token>`.
- Refresh token: long-lived JWT, stored hashed (Argon2) per **Session** row, returned
  as an `httpOnly` cookie (`refresh_token`) and rotated on every `/auth/refresh`.
- `logout-all` revokes every session; password reset/change revokes all sessions.
- Email verification + password reset use single-use hashed `AuthToken`s.

### Subscriptions & payments

- Every account starts on a **3-day trial** (`TRIAL`). `SubscriptionGuard` gates
  premium routes (e.g. activity attempts) once the trial/plan lapses.
- Plans: `MONTH_1`, `MONTH_3`, `MONTH_12` (see `plans.ts`).
- Payments go through the `PaymentProvider` interface (token `PAYMENT_PROVIDER`).
  The default `ManualPaymentProvider` lets you exercise the full flow without a
  gateway. Implement the interface for Stripe/Paddle/etc and swap the binding in
  `subscriptions.module.ts` — no gateway is hardcoded into business logic.

## Scripts

| Script                        | Description                          |
| ----------------------------- | ------------------------------------ |
| `npm run start:dev`           | Watch mode                           |
| `npm run build`               | Compile to `dist/`                   |
| `npm run prisma:migrate`      | Create/apply dev migration           |
| `npm run prisma:migrate:deploy` | Apply migrations (prod)            |
| `npm run prisma:seed`         | Seed reference + demo data           |
| `npm run prisma:studio`       | Open Prisma Studio                   |
| `npm run db:reset`            | Reset DB + re-seed                   |

## Neon setup

1. Create a Neon project + database `kiddy`.
2. Copy the **pooled** connection string into `DATABASE_URL` and the **direct**
   (non-pooled) one into `DIRECT_URL` (used by migrations).
3. Run `npm run prisma:migrate` then `npm run prisma:seed`.

## API surface (high level)

- `auth/*` — register, login, refresh, logout, logout-all, sessions, verify-email,
  forgot/reset/change-password, me
- `parents/me` — profile get/update/deactivate
- `children` — CRUD + `:id/stats`
- `activities` — list/get (public), admin CRUD
- `children/:childId/attempts` — start / complete / abandon / list
- `children/:childId/stars` — balance, transactions, earn, spend, transfer, unlock
- `children/:childId/unlocks` — active, history, usage (record/list), cancel
- `children/:childId/xp` — progress, history, events
- `children/:childId/streak` — current/best + history
- `children/:childId/achievements` — list + evaluate; `achievements` catalog
- `children/:childId/challenges` — list + claim; `admin/challenges` CRUD
- `subscriptions` — plans, me, checkout, cancel, payments, webhook
- `analytics` — overview (DAU/WAU), per-child summary
- `audit-logs` — current user audit trail

See full request/response schemas in **Swagger** at `/api/docs`.
