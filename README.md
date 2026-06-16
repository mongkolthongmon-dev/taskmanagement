# Task Manager — Next.js + Neon Postgres

A small full-stack task list. Add tasks, edit them, mark them complete, and delete them.
All data is persisted in a **Neon serverless Postgres** database and the app is
deployed on **Vercel**.

## App idea

A **task list**: a single page that shows every task (newest first), a form to
add new tasks, a checkbox to toggle completion, inline editing, and a delete
button.

## Database access approach — and why

- **ORM: [Drizzle ORM](https://orm.drizzle.team/)** with a typed schema
  (`src/db/schema.ts`) and SQL migrations in `drizzle/`. Drizzle gives a typed
  query API and parameterized queries (which prevent SQL injection), and its
  migrations make the schema reproducible.
- **Driver: `node-postgres` (`pg`) with a connection pool.** Vercel runs this
  app on **Fluid compute**, where the module scope is reused across requests, so
  a single pool opened at module scope (`src/db/index.ts`) is reused instead of
  reconnecting per request. The pool is registered with
  `attachDatabasePool` from `@vercel/functions` so Vercel can drain idle
  connections before suspending an instance. (Neon's HTTP serverless driver is
  the better pick for fully-isolated, Lambda-style hosts; `pg` fits Vercel.)
- **Pooled connection string.** `DATABASE_URL` uses Neon's **pooled** endpoint
  (host contains `-pooler`), which routes through PgBouncer — the right choice
  for serverless/bursty concurrency.

## How it meets the requirements

- **Schema** — one `tasks` table with a primary key (`id`) and a timestamp
  column (`created_at`), created via a Drizzle migration.
- **Backend** — Server Actions in `src/app/actions.ts`:
  - write: `addTask`, `updateTask` (edit title), `toggleTask`, `deleteTask`
  - read: `src/app/page.tsx` (a Server Component) selects all tasks
  - errors are caught and surfaced to the UI instead of crashing
- **Frontend** — `page.tsx` lists tasks; `AddTaskForm` submits new ones and the
  list reflects the change via `revalidatePath`.
- **Config** — the connection string lives only in environment variables, never
  in committed code.

## Project structure

```
src/
  app/
    page.tsx        # Server Component: reads tasks from Neon
    actions.ts      # Server Actions: add / toggle / delete (writes)
    layout.tsx
  components/
    add-task-form.tsx  # client form (useActionState)
    task-item.tsx      # client row: toggle + delete
  db/
    schema.ts       # Drizzle table definition (typed)
    index.ts        # pg Pool + Drizzle client (module scope)
drizzle/            # generated SQL migrations
drizzle.config.ts
```

## Run it locally

> Requires Node.js 18+ and a Neon database.

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your environment file (it is git-ignored — never commit it):
   ```bash
   cp .env.example .env.local
   ```
   Then set `DATABASE_URL` in `.env.local` to your Neon **pooled** connection
   string (Neon console → **Connect**, or `neonctl connection-string --pooled`).
3. Apply the database schema:
   ```bash
   npm run db:migrate
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

Useful scripts:

- `npm run db:generate` — regenerate migration files after editing the schema.
- `npm run db:migrate` — apply pending migrations to the database.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. In the Vercel project → **Settings → Environment Variables**, add
   `DATABASE_URL` with the same Neon pooled connection string (for the
   Production environment).
4. Deploy. The schema is applied with `npm run db:migrate` (run once against the
   production database, e.g. locally pointing at the production branch, or as a
   build/deploy step).

## Notes & answers to the research questions

- **Pooled vs. direct connection string** — the pooled endpoint (with
  `-pooler`) multiplexes many short-lived serverless connections through
  PgBouncer, avoiding connection exhaustion. The direct/unpooled string is for
  long-lived connections and tools like migrations. This app uses the pooled
  string at runtime.
- **Why queries run on the server** — keeping the connection string and SQL on
  the server (Server Components / Server Actions) means credentials never reach
  the browser bundle.
- **Why a secret in an env var** — committing a connection string leaks
  credentials to anyone with repo access and bakes environment-specific config
  into code. `.env.local` is git-ignored; production secrets live in Vercel.
- **Local vs. Vercel env vars** — locally they come from `.env.local`; in
  production Vercel injects them from its project settings.
- **Data persistence across redeploys** — data lives in Neon, not in the app
  instance, so redeploying the app does not touch the database.
- **Preventing SQL injection** — Drizzle uses parameterized queries, so
  user-provided values are never concatenated into SQL.
