#!/usr/bin/env bash
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg build-essential nginx postgresql postgresql-contrib redis-server ufw certbot python3-certbot-nginx
# Node.js 20 LTS
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
npm i -g pm2
# Enable services
systemctl enable --now nginx
systemctl enable --now postgresql
systemctl enable --now redis-server || systemctl enable --now redis
# Firewall
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true
# Postgres: create DB and user
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='uber'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER uber WITH PASSWORD 'uber_pass';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='uber'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE uber OWNER uber;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE uber TO uber;"
# Nginx sites
cat > /etc/nginx/sites-available/testyourapp.info << 'NGINX'
server {
    listen 80;
    server_name testyourapp.info www.testyourapp.info;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX

cat > /etc/nginx/sites-available/api.testyourapp.info << 'NGINX'
server {
    listen 80;
    server_name api.testyourapp.info;
    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_pass http://127.0.0.1:4000;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/testyourapp.info /etc/nginx/sites-enabled/testyourapp.info
ln -sf /etc/nginx/sites-available/api.testyourapp.info /etc/nginx/sites-enabled/api.testyourapp.info
nginx -t
systemctl reload nginx
