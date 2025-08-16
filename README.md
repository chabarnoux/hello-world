
hello! My name is Ahmed.

## Ride App Monorepo

- API: `apps/api` (Express + Prisma + Socket.IO)
- Web: `apps/web` (Next.js)

### Local Development

1. Copy envs:
   - `cp apps/api/.env.example apps/api/.env`
   - `cp apps/web/.env.example apps/web/.env`
2. Start services via Docker:
   - `docker compose up -d db redis`
3. Install deps and generate Prisma client:
   - `npm install`
   - `npm run -w @uber/api prisma:generate`
4. Run dev:
   - `npm run dev`

API at http://localhost:4000, Web at http://localhost:3000.
