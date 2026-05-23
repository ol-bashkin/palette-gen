# Palette Generator — Roadmap Design

**Date:** 2026-05-23  
**Status:** Approved

---

## Context

Palette Generator is a pure frontend SPA (Vue 3 + Vite + TypeScript + Pinia) for building OKLCH-based color scales. Currently: localStorage persistence, no backend, no auth, PWA-ready. The tool targets designers who understand color theory and ship output directly into CSS or token files.

This is an open-source pet project. Primary goal is **skill development** — real VPS, own backend, own database. Self-hostable Docker Compose is a backlog item that emerges naturally from the infra choices.

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Vue 3 + Vite + TypeScript + Pinia | existing, unchanged |
| Backend | Go + Chi router | lightweight, stdlib-compatible, binary in container |
| Database | PostgreSQL + sqlc | write raw SQL → generated type-safe Go code; teaches real SQL |
| Migrations | goose | simple up/down files, widely used |
| Auth | Sessions via httponly cookie + goth (OAuth) | learn the mechanics, not hidden behind a library |
| Deployment | Docker Compose on VPS | doubles as self-host mechanism for users later |

---

## Roadmap

### Phase 1 — Cloud Foundation

Replace localStorage with server-side palette storage. Add multi-device sync and a personal account.

- Go API server with Chi, structured as `cmd/api` + `internal/` packages
- PostgreSQL schema: users, sessions, palettes, palette_colors, shade_overrides
- goose migrations from day one
- sqlc for all DB queries — no ORM magic
- Auth: email + password (bcrypt, httponly session cookie), GitHub OAuth via goth
- Palette CRUD endpoints; frontend switches from localStorage to API calls
- Basic account page: list palettes, delete account
- Docker Compose: `api` + `postgres` + `nginx` services, dev and prod variants

**Success criteria:** a designer logs in from two different browsers and sees the same palette.

---

### Phase 2 — Designer Tooling

Deepen the color science capabilities without changing the architecture.

- **Contrast checker** — WCAG AA/AAA ratios between any two shades in the palette
- **Dark palette generation** — derive a dark-mode scale from a light-mode palette
- **Color blindness simulation** — Deuteranopia, Protanopia, Tritanopia previews
- **New export formats** — Tailwind `colors` config, Style Dictionary JSON, Penpot tokens
- **Palette snapshots** — named version history per palette, restore to any snapshot

**Success criteria:** a designer can audit a11y contrast and export to their toolchain without leaving the app.

---

### Phase 3 — Community

Add sharing and discovery without requiring auth for consumers.

- **Public share link** — read-only URL for a palette, no login needed to view
- **Explore / gallery page** — public palettes opted in by their authors
- **Fork** — clone someone's public palette into your own account
- **Tags and search** — tag palettes by mood/use-case, full-text search on name/tags

**Success criteria:** a designer shares a palette link in a Slack thread and the recipient can fork it into their account in two clicks.

---

## Backlog

- **Self-host Docker Compose for end users** — publish a `docker-compose.yml` + `.env.example` so anyone can run their own instance; the infra from Phase 1 makes this nearly free
- **Go CLI tool** — `palette-gen generate --base="#3B82F6"` outputs CSS variables or JSON to stdout; ships as a single binary
- **Figma plugin** — import/export directly from Figma; likely Phase 3+ territory

---

## Monetization Ideas (if ever relevant)

The tool stays open-source. Potential paths if it gains traction:
- **GitHub Sponsors** — lowest friction, no product changes needed
- **Hosted Pro tier** — private palettes, team workspaces, priority support; self-host remains free
- **CLI binary distribution** — pay-what-you-want on Gumroad for convenience; source always free

---

## Non-Goals

- Native mobile app
- Real-time multiplayer / collaborative editing
- AI color suggestions
- White-label / embed widget
