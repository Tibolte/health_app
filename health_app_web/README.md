# Health App — Web

Training dashboard that syncs workout data from [Intervals.icu](https://intervals.icu) and displays weekly training load, fitness metrics, and power personal bests.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- An [Intervals.icu](https://intervals.icu) account with an API key

## Setup

```bash
# Install dependencies
npm install

# Create environment file and fill in your credentials
cp .env.example .env

# Start PostgreSQL
npm run docker:up

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Start dev server
npm run dev
```

## Development workflow

### 1. Create a feature branch

```bash
git checkout -b feat/my-feature
```

### 2. Develop locally

```bash
npm run docker:up    # start local PostgreSQL (if not running)
npm run dev          # Next.js on localhost:3000
```

If you changed `prisma/schema.prisma`:

```bash
npm run db:push      # push schema to local DB
npm run db:generate  # regenerate Prisma Client
```

Then restart the dev server.

### 3. Verify before committing

```bash
npm run type-check   # TypeScript strict check
npm run lint         # ESLint
npm run test         # Vitest
```

### 4. Commit, push, and open a PR

```bash
git add <files>
git commit -m "Add my feature"
git push -u origin feat/my-feature
gh pr create
```

CI runs automatically on the PR: lint → type-check → test → build.

### 5. Merge → auto-deploy

Merge the PR to `main` on GitHub. Vercel detects the push and deploys automatically — including any Prisma schema changes (handled by the `vercel-build` script).

## Production

- **Hosting:** Vercel (auto-deploys from `main`)
- **Database:** Supabase (PostgreSQL)
- **Build command:** `npm run vercel-build` — runs `prisma generate`, `prisma db push`, then `next build`

### Environment variables (Vercel dashboard)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase pooled connection string |
| `INTERVALS_API_KEY` | Intervals.icu API key |
| `INTERVALS_ATHLETE_ID` | Intervals.icu athlete ID |
| `API_SECRET_KEY` | Random 64-char hex string for API auth |
| `ALLOWED_ORIGINS` | Production domain (e.g. `https://health-app-xxx.vercel.app`) |

## API authentication

All `/api/*` routes (except `/api/health`) are protected by API key authentication.

- **Web frontend:** same-origin requests are auto-allowed, no key needed
- **Mobile apps / external clients:** send `Authorization: Bearer <API_SECRET_KEY>` on every request
- **Rate limits:** 60 GET/min, 10 POST/min per IP

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run vercel-build` | Vercel build: generate Prisma + push schema + build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run test` | Run tests with Vitest |
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |

## Architecture

```
src/
├── app/
│   ├── layout.tsx              Root HTML layout
│   ├── page.tsx                Dashboard UI (client component)
│   └── api/
│       ├── health/route.ts     GET /api/health
│       ├── sync/route.ts       GET + POST /api/sync
│       ├── fitness-trend/      GET /api/fitness-trend
│       └── steps/route.ts      GET + POST + OPTIONS /api/steps
├── components/
│   └── Toast.tsx               Toast notification + useToast hook
├── lib/
│   ├── auth.ts                 API key validation + same-origin check
│   ├── errors.ts               Error response sanitization
│   ├── rate-limit.ts           In-memory sliding window rate limiter
│   ├── prisma.ts               Prisma client singleton
│   ├── date-utils.ts           Week range calculator (Mon–Sun)
│   └── intervals.ts            Intervals.icu API client + data mappers
└── middleware.ts               Auth + rate limiting for /api/* routes
```

**Data flow:** Click Sync → `POST /api/sync` fetches activities, events, and wellness from Intervals.icu for the current week → maps and upserts into PostgreSQL → `GET /api/sync` reads it back for the dashboard.

## Database models

- **Workout** — completed activities and planned workouts (from Intervals.icu)
- **FitnessMetric** — daily CTL (fitness), ATL (fatigue), TSB (form)
- **PowerPb** — power personal bests at various durations
- **StepCount** — daily step counts (from HealthKit via iOS app)

## Testing

Tests use [Vitest](https://vitest.dev/) with `@testing-library/react` for component tests. Prisma and `fetch` are mocked at module level — no database needed to run tests.

```bash
npm run test
```

## CI

GitHub Actions runs on push/PR to `main`: lint → type-check → test → build.
