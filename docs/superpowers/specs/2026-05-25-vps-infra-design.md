# VPS Infrastructure Design

**Date:** 2026-05-25
**Status:** Approved

---

## Context

Migrating palette-gen.app from Vercel to a self-hosted VPS. The VPS has two IP addresses — one already running OC Server, the second (clean Ubuntu 24.04) will host this and future projects. The roadmap (Phase 1) adds a Go API + PostgreSQL via Docker Compose, so the infrastructure must accommodate this from day one without re-architecting.

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Reverse proxy | Nginx on host + Certbot | Standard, full control, auto-renew via systemd timer |
| Container strategy | Docker Compose per project | Isolation, aligns with roadmap Phase 1 |
| Image registry | GHCR (GitHub Container Registry) | Free for public repos, native GitHub Actions integration |
| CI/CD | GitHub Actions | Push to main → build image → SSH deploy |
| Infra config | Separate `infra` repository | Host nginx configs don't belong to any single project |

---

## Repository Structure

### `palette-generator` repo
```
palette-generator/
├── Dockerfile                        # multi-stage: node build → nginx:alpine
├── docker/
│   └── nginx.conf                    # internal container nginx (SPA routing)
└── .github/
    └── workflows/
        └── deploy.yml
```

### `infra` repo (new)
```
infra/
├── nginx/
│   └── sites/
│       ├── palette-gen.app.conf      # host nginx site config
│       └── ...                       # future projects
└── README.md                         # full server bootstrap instructions
```

### Server
```
/srv/palette-gen.app/
└── docker-compose.yml                # production only: pull + run, no build
```

---

## Server Topology

```
VPS second IP (Ubuntu 24.04)
│
├── Nginx (host) — 80/443, SSL via Certbot
│   ├── palette-gen.app  → proxy_pass 127.0.0.1:8080
│   └── <future project> → proxy_pass 127.0.0.1:808X
│
└── /srv/
    ├── palette-gen.app/
    │   └── docker-compose.yml
    │       └── web (nginx:alpine)          ← now
    │           [+ api (Go), + postgres]    ← Phase 1
    └── <future-project>/
        └── docker-compose.yml
```

Containers bind only to `127.0.0.1` — never exposed directly to the internet. Host nginx is the sole entry point and terminates SSL.

---

## Dockerfile

Multi-stage build. Node builds the Vite SPA, nginx:alpine serves it.

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

**`docker/nginx.conf`** — internal container config for SPA routing:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

---

## Production Docker Compose (`/srv/palette-gen.app/docker-compose.yml`)

```yaml
services:
  web:
    image: ghcr.io/olegbashkin/palette-gen:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
```

Phase 1 extension — add to the same file without changing anything else:
```yaml
  api:
    image: ghcr.io/olegbashkin/palette-gen-api:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8080"
    environment:
      - DATABASE_URL=postgres://...
    depends_on: [postgres]

  postgres:
    image: postgres:17-alpine
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=palette
      - POSTGRES_USER=palette
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

volumes:
  postgres_data:
```

---

## GitHub Actions (`deploy.yml`)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          push: true
          tags: ghcr.io/olegbashkin/palette-gen:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy on VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /srv/palette-gen.app
            docker compose pull
            docker compose up -d
            docker image prune -f
```

**GitHub Secrets required:**
| Secret | Value |
|---|---|
| `VPS_HOST` | VPS second IP address |
| `VPS_USER` | `deploy` (non-root user) |
| `VPS_SSH_KEY` | Private SSH key for deploy user |

`GITHUB_TOKEN` is created automatically by GitHub Actions.

---

## Host Nginx (`infra` repo: `nginx/sites/palette-gen.app.conf`)

```nginx
server {
    listen 80;
    server_name palette-gen.app www.palette-gen.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name palette-gen.app www.palette-gen.app;

    ssl_certificate     /etc/letsencrypt/live/palette-gen.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/palette-gen.app/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;

    add_header X-Content-Type-Options  "nosniff"                        always;
    add_header X-Frame-Options         "DENY"                           always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass         http://127.0.0.1:8080;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Phase 1 addition — one new `location` block, no other changes:
```nginx
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
```

Adding a new project in the future: new file in `nginx/sites/`, `ln -s` to `sites-enabled/`, `certbot --nginx -d <domain>`, `nginx -s reload`.

---

## Certbot Setup

```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d palette-gen.app -d www.palette-gen.app
```

Ubuntu 24.04 includes a systemd timer for auto-renewal — no manual cron needed.

---

## Server Hardening

### Firewall (UFW)

Must be configured before exposing the server. Docker bypasses UFW iptables rules for container ports — the `127.0.0.1` binding in compose is what keeps containers off the internet, not UFW.

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### SSH Hardening

Disable password auth and root login in `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
systemctl restart ssh
```

### Deploy User Setup

```bash
adduser deploy
usermod -aG docker deploy
# Add public key to /home/deploy/.ssh/authorized_keys
```

**Note:** Adding `deploy` to the `docker` group is equivalent to granting root access to the Docker daemon. This is an accepted trade-off for a single-developer VPS. The SSH key used for GitHub Actions must be a dedicated key pair — never reuse a personal key.

### .env File Permissions

The `.env` file containing `POSTGRES_PASSWORD` (Phase 1) must be readable only by the deploy user:

```bash
chmod 600 /srv/palette-gen.app/.env
```

---

## DNS Migration Order

Run in this exact order to avoid downtime:

1. Set up server: nginx, certbot, deploy user, docker
2. Place `docker-compose.yml` in `/srv/palette-gen.app/`, run `docker compose pull && docker compose up -d`
3. Verify site opens at `http://<VPS-IP>:8080` directly
4. Add GitHub Secrets → trigger Actions → confirm pipeline is green
5. Run `certbot --nginx` (domain must already resolve to VPS IP)
6. Change DNS A record for `palette-gen.app` from Vercel IP to VPS IP
7. Wait for propagation, verify HTTPS works
8. Remove project from Vercel

**Note:** Certbot requires the domain to resolve to the VPS IP before running — do step 5 after step 6, or use `--standalone` mode with nginx stopped temporarily.

---

## Phase 1 Extension Checklist

When Go API is ready (roadmap Phase 1), only these changes needed:

- [ ] Add `api` and `postgres` services to `/srv/palette-gen.app/docker-compose.yml`
- [ ] Add `location /api/` block to host nginx config in `infra` repo, copy to server
- [ ] Add `POSTGRES_PASSWORD` to server environment (e.g. `.env` file next to compose)
- [ ] Create separate GitHub Actions workflow for the API image build+push
