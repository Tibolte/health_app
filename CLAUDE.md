# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git

Never add `Co-Authored-By` lines to commit messages.

## Repository Structure

Monorepo with two projects:
- **`health_app_web/`** — Next.js 14 dashboard (TypeScript, React 18, Prisma, PostgreSQL)
- **`health_app_ios/`** — SwiftUI iOS app (HealthKit → web API). See `health_app_ios/CLAUDE.md` for iOS-specific conventions.

All web commands run from `health_app_web/`. iOS commands run from `health_app_ios/`.

## Commands

```bash
# Dev
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Production build

# Quality
npm run type-check       # TypeScript strict check (tsc --noEmit)
npm run lint             # ESLint
npm run test             # Vitest (all tests)
npm run test -- src/lib/__tests__/date-utils.test.ts  # Single test file

# Database
npm run docker:up        # Start PostgreSQL container
npm run db:push          # Push schema to DB (no migrations — uses db push)
npm run db:generate      # Regenerate Prisma Client after schema changes
npm run db:studio        # Prisma Studio GUI (localhost:5555)
```

**After changing `prisma/schema.prisma`:** run `db:push` then `db:generate`, then restart the dev server. The global Prisma singleton (`src/lib/prisma.ts`) caches the client across hot reloads — a full process restart is required for schema changes to take effect.

## Architecture

**Data flow:** Dashboard Sync button → `POST /api/sync` → fetches from Intervals.icu API (activities, events, wellness, power curves) → validates with Zod → upserts into PostgreSQL via Prisma → `GET /api/sync` reads it back → `useDashboardData` hook renders.

**API routes** (`src/app/api/`):
- `sync/route.ts` — main sync endpoint (GET reads DB, POST syncs from Intervals.icu)
- `steps/route.ts` — step counts from iOS app (GET/POST/OPTIONS with CORS)
- `fitness-trend/route.ts` — historical CTL/ATL/TSB data
- `health/route.ts` — health check

**Key modules:**
- `src/lib/intervals.ts` — Intervals.icu API client: Zod schemas, fetch functions, data mappers
- `src/lib/date-utils.ts` — week range calculations (Mon–Sun)
- `src/lib/prisma.ts` — Prisma singleton (cached on `globalThis` in dev)
- `src/types/` — shared interfaces: `models.ts` (DB shapes), `api.ts` (response types)
- `src/hooks/useDashboardData.ts` — main dashboard data hook (fetch, sync, toast)

**Styling:** inline React styles with `COLORS` constants from `src/lib/constants.ts`. CSS animations defined in `src/app/layout.tsx` global `<style>` tag. No Tailwind, no CSS modules.

## Database

PostgreSQL 16 via Docker. Prisma ORM with **`db push`** (not migrations).

Four models: `Workout`, `FitnessMetric`, `PowerPb`, `StepCount`. See `prisma/schema.prisma`.

## Testing

Vitest with `@testing-library/react`. Tests mock Prisma and `fetch` at module level — no database needed. Tests colocated as `__tests__/` directories next to source files.

## Pull Requests

When creating a PR that includes UI changes (web or iOS):
- **Screenshots:** attach before/after screenshots or a simulator screenshot showing the change. Use the iOS Simulator screenshot command (`xcrun simctl io booted screenshot`) or a browser screenshot as appropriate.
- **Manual verification steps:** include a checklist of manual QA steps in the PR body under `## Test plan`, for example:
  - Web: "Open localhost:3000, click Sync, verify the chart renders with data"
  - iOS: "Run on simulator, verify light/dark mode, check Xcode previews render"

## CI

GitHub Actions (`.github/workflows/ci.yml`): lint → type-check → test → build on push/PR to `main`.

## Path Alias

`@/*` maps to `./src/*` (configured in tsconfig.json and vitest.config.ts).

## Environment

Requires `.env` with `DATABASE_URL`, `INTERVALS_API_KEY`, `INTERVALS_ATHLETE_ID`. Copy from `.env.example`.

Intervals.icu auth: HTTP Basic with `API_KEY:{key}` base64-encoded.
