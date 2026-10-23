# Vacation Requests

Employees submit vacation requests; managers approve or reject them.

Vue 3 + Vite · Node + TypeScript on TravelFactory's
[Common Event Framework](https://www.npmjs.com/package/commoneventframework) · PostgreSQL + TypeORM
· Tailwind CSS.

---

## Run it

Requires Docker.

```bash
docker compose up
```

That starts Postgres, the API and the UI, creates the schema and seeds the demo users.

- **App:** http://localhost:5173
- **API docs:** http://localhost:8888/doc

| Email | Role |
| --- | --- |
| `alice@travelfactory.test` | Requester |
| `bruno@travelfactory.test` | Requester |
| `claire@travelfactory.test` | **Validator** |

Password for all three: `password123`. You can also sign up — new accounts are always Requesters.

<details>
<summary>Running without Docker</summary>

```bash
docker compose up -d postgres          # or use your own Postgres
cd backend  && npm install && npm run seed && npm run dev   # :8888
cd frontend && npm install && npm run dev                   # :5173
```

Copy `backend/.env.example` to `backend/.env` first. Postgres is on host port **5433** so it
doesn't clash with a local install.

</details>

---

## API

REST over CEF, which routes by an OpenAPI file ([`backend/src/root.yaml`](backend/src/root.yaml))
instead of a router object. Each route names a **handler** and an **input parser**; the parser
authenticates and validates, and anything it rejects never reaches the handler. Auth is a JWT
bearer token.

| Method | Path | Who |
| --- | --- | --- |
| `POST` | `/auth/register` · `/auth/login` | anyone |
| `GET` | `/auth/me` | signed in |
| `POST` | `/vacation-requests` | Requester |
| `GET` | `/vacation-requests` | Requester — own, paginated |
| `GET` | `/vacation-requests/all` | Validator — filter by `status`, `userId`, paginated |
| `GET` | `/vacation-requests/team` | both — approved only |
| `GET` | `/users` | Validator |
| `PATCH` | `/vacation-requests/:id/approve` | Validator |
| `PATCH` | `/vacation-requests/:id/reject` | Validator — comment required |

Lists return `{ data, total, page, limit, totalPages }`. Errors return `{ error }` with a real
status code: `400` invalid, `401` not signed in, `403` wrong role, `404` missing, `409` already
decided.

---

## Database

Two tables.

**users** — `id`, `name`, `email` (unique), `password` (bcrypt), `role`, `created_at`

**vacation_requests** — `id`, `user_id` → users, `start_date`, `end_date`, `reason`, `status`,
`comments`, `created_at`, `updated_at`

`role` is `Requester | Validator`; `status` is `Pending | Approved | Rejected`. Dates are `date`
columns, not timestamps — vacations are whole days, so no timezone can shift them. There's an index
on `(user_id, start_date)`, which serves both the overlap check and a user's own list.

---

## Business rules

Enforced on the server, so the UI can't bypass them.

1. End date must be after the start date.
2. A user's requests can't overlap — checked against **Pending and Approved** only, so a rejected
   request doesn't block those dates.
3. Once decided, a request can't change → `409`.
4. Requests can't start in the past.
5. Rejecting requires a comment, which the requester then sees.
6. Only Validators approve or reject.

Each action is a **command** (`CreateVacationRequestCommand`, `ApproveVacationRequestCommand`,
`RejectVacationRequestCommand`) that checks the rules, saves, and emits an **event**
(`VacationRequestApprovedEvent`, …). Events are logged today; that subscriber is where
notifications would attach.

Approve and reject run as `UPDATE … WHERE status = 'Pending'`, so if two validators click at the
same moment the database decides: one wins, the other gets `409`.

---

## Technical decisions

- **CEF for routing, our own layer for logic.** CEF maps OpenAPI routes to handlers; commands and
  events sit above it, so business rules don't depend on HTTP.
- **Auth in input parsers.** CEF has no middleware, so each protected route's parser calls
  `requireRole`, and a rejection short-circuits before the handler runs.
- **Action sub-routes for decisions.** `/approve` and `/reject` map one-to-one onto their commands.
- **Concurrency in the database.** Approve and reject are conditional `UPDATE`s, so a race can't
  decide a request twice.
- **`synchronize` over migrations.** The schema is built from the entities, which keeps setup to
  one command.
- **Dates as `date`, not timestamps.** Vacations are whole days, so timezones can't shift them.
- **One Pinia store.** Only the session is global; everything else is local component state.
- **Containers for everything.** Postgres, API and UI each run as a service, so `docker compose up`
  is the only setup step. Both app containers run dev servers, so source changes reload without a
  rebuild.

## Known limitations

- **No automated tests.** Flows were checked manually and with a browser script that isn't in the repo.
- **`synchronize: true`** is unsafe for production; it needs migrations before real use.
- **In-process events.** They are logged and not persisted, and nothing else subscribes yet.
- **No refresh tokens.** The JWT lasts 8 hours, then the user signs in again.
- **Same-day requests are rejected**, following the spec's "end must be after start" wording.
- **`npm audit` warnings** come from CEF's own dependencies.
