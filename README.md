# S.D.M. Academy Shaulana — School Management System

A modern school ERP + public website for S.D.M. Academy Shaulana, built with Next.js 16, Prisma, and Tailwind CSS.

## Features

- **Public Website** — Home, About, Academics, Facilities, Admissions, Faculty, Notices, Contact
- **ERP Dashboard** — role-based portal for Principal, Admin Staff, and Teachers
  - Student registration, profiles, bulk Excel import
  - Daily attendance with 10 AM lock + principal override
  - Marks entry, auto-grade calculation
  - Fee structure & payment recording
  - Notices, gallery & media management
  - Analytics dashboard with charts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.2.7 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma v7 + `@prisma/adapter-libsql` |
| Database (local) | SQLite (`file:./dev.db`) |
| Database (prod) | [Turso](https://turso.tech) (free tier) |
| Auth | Custom JWT via `jose` |
| Hosting | Vercel (free tier) |

---

## Local Development

```bash
# 1. Clone & install
git clone https://github.com/siddhartha28/sdmacademy.git
cd sdmacademy
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — default values work for local dev

# 3. Push schema & seed demo data
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Login Credentials

| Role | Phone | Password |
|------|-------|----------|
| Principal | 9999999999 | principal123 |
| Admin | 9999999998 | admin123 |
| Teacher | 9999999997 | teacher123 |

---

## Deploy to Vercel

### Step 1 — Create a free Turso database

```bash
# Install Turso CLI
npm install -g @turso/cli

# Log in
turso auth login

# Create a database
turso db create sdm-academy

# Get the database URL
turso db show sdm-academy --url

# Create an auth token
turso db tokens create sdm-academy
```

### Step 2 — Push schema to Turso

```bash
# In your .env, set:
# DATABASE_URL="libsql://<db-name>-<org>.turso.io"
# TURSO_AUTH_TOKEN="<token>"

npm run db:push
npm run db:seed   # optional: seeds demo data
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import `siddhartha28/sdmacademy`
2. Add these **Environment Variables** in Vercel project settings:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `libsql://<db-name>-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | your Turso auth token |
| `JWT_SECRET` | a strong random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | your Vercel deployment URL |

3. Click **Deploy** — Vercel runs `prisma generate && next build` automatically.

---

## Database Commands

```bash
npm run db:push       # sync schema to database
npm run db:seed       # seed demo data
npm run db:studio     # open Prisma Studio (GUI)
npm run db:reset      # drop + re-push + re-seed (local only)
```
