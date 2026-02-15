# Health App

Training dashboard that syncs workout data from [Intervals.icu](https://intervals.icu) and displays weekly training load, fitness metrics, and power personal bests.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- An [Intervals.icu](https://intervals.icu) account with an API key

## Setup

```bash
# Install dependencies
npm install

# Create environment file and fill in your Intervals.icu credentials
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

## Verify

- **Dashboard:** http://localhost:3000 — click "Sync" to pull data from Intervals.icu
- **Health check:** http://localhost:3000/api/health
- **Prisma Studio:** `npm run db:studio` then open http://localhost:5555

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build |
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
│       └── sync/route.ts       GET + POST /api/sync
├── components/
│   └── Toast.tsx               Toast notification + useToast hook
└── lib/
    ├── prisma.ts               Prisma client singleton
    ├── date-utils.ts           Week range calculator (Mon–Sun)
    └── intervals.ts            Intervals.icu API client + data mappers
```

**Data flow:** Click Sync → `POST /api/sync` fetches activities, events, and wellness from Intervals.icu for the current week → maps and upserts into PostgreSQL → `GET /api/sync` reads it back for the dashboard.

## Database Models

- **Workout** — completed activities and planned workouts (from Intervals.icu)
- **FitnessMetric** — daily CTL (fitness), ATL (fatigue), TSB (form)
- **PowerPb** — power personal bests at various durations

## Testing

Tests use [Vitest](https://vitest.dev/) with `@testing-library/react` for component tests. Prisma and `fetch` are mocked at module level — no database needed to run tests.

```bash
npm run test
```

## CI

GitHub Actions runs on push/PR to `main`: lint → type-check → test → build.

## Database

Connect directly to PostgreSQL:

```bash
psql postgresql://postgres:postgres@localhost:5432/health_app
```
