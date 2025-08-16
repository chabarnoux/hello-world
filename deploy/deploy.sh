#!/usr/bin/env bash
set -euo pipefail
APP_DIR=/opt/ride-app
TARBALL=/root/ride-app.tar.gz
mkdir -p "$APP_DIR"
cd "$APP_DIR"
rm -rf apps packages package.json tsconfig.base.json || true
# Extract code
if [ -f "$TARBALL" ]; then
  tar xzf "$TARBALL" -C "$APP_DIR"
fi
# Install dependencies
npm install
# Env files
mkdir -p apps/api apps/web
JWT_SECRET=$(openssl rand -hex 32)
cat > apps/api/.env <<EOF
PORT=4000
DATABASE_URL=postgresql://uber:uber_pass@localhost:5432/uber?schema=public
JWT_SECRET=$JWT_SECRET
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=https://testyourapp.info,https://www.testyourapp.info,http://testyourapp.info,http://www.testyourapp.info
EOF

cat > apps/web/.env <<EOF
NEXT_PUBLIC_API_URL=https://api.testyourapp.info
EOF
# Prisma generate and migrate
cd "$APP_DIR/apps/api"
npx prisma generate
npx prisma migrate deploy
# Build all
cd "$APP_DIR"
npm run build
# PM2
pm2 delete ride-api || true
pm2 delete ride-web || true
pm2 start --name ride-api --cwd "$APP_DIR/apps/api" -- node dist/index.js
pm2 start --name ride-web --cwd "$APP_DIR/apps/web" -- npm run start
pm2 save
# Reload nginx
nginx -t && systemctl reload nginx