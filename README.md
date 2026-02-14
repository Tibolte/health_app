# Health App

Minimal Next.js backend skeleton with Prisma and PostgreSQL.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Setup

```bash
# Install dependencies
npm install

# Create environment file
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

- **Status page:** http://localhost:3000
- **Health check:** http://localhost:3000/api/health (returns `{ "status": "ok", "timestamp": "..." }`)
- **Prisma Studio:** `npm run db:studio` then open http://localhost:5555

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma Client from schema |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run docker:up` | Start PostgreSQL container |
| `npm run docker:down` | Stop PostgreSQL container |

## Database

Connect directly to PostgreSQL:

```bash
psql postgresql://postgres:postgres@localhost:5432/health_app
```

## Next Steps

1. Add models to `prisma/schema.prisma`
2. Run `npm run db:push` to sync schema
3. Create API routes under `src/app/api/`
