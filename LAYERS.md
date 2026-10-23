# Development Layers

Build plan for the vacation request manager, from empty repo to submission.

The project is built in **thin, independently verifiable layers**. Each layer ends with a concrete
check that must pass before the next layer starts, so no code is ever stacked on an unverified
foundation. Layers are also the commit boundaries.

**Stack is dictated by the assignment:** Vue.js, Node.js, PostgreSQL + TypeORM, Tailwind CSS, and
TravelFactory's [`commoneventframework`](https://www.npmjs.com/package/commoneventframework) (CEF).
No technology selection was required.

| Layer | Scope                                        | Status              |
| ----- | -------------------------------------------- | ------------------- |
| 0     | Scaffold + de-risk                           | ✅ Done (`aa3c869`) |
| 1     | Persistence: entities, DataSource, seed      | ✅ Done             |
| 2     | Authentication + role guard                  | ✅ Done             |
| 3     | Business rules, command/event buses, create  | ✅ Done             |
| 4     | Read endpoints: filters + pagination         | ✅ Done             |
| 5     | Approve / reject + domain events + team view | ✅ Done             |
| 6     | Frontend shell: routing, auth, API client    | ✅ Done             |
| 7     | Requester interface                          | ✅ Done             |
| 8     | Validator interface + team planning page     | ✅ Done             |
| 9     | Documentation + final verification           | ⬜ Next             |

---

## The architectural point that shapes everything

CEF is **not** Express and **not** a domain event bus. It is an AWS Lambda event normalizer and
router:

- Routes live in `src/root.yaml` (OpenAPI 3.0) via `x-handler: handlers/file#exportName`, with an
  optional `x-inputParser`.
- Handlers are `(input, event: CommonEvent) => Promise<Response | object>`. A plain object returned
  is auto-wrapped in `200`.
- An inputParser is `(event: CommonEvent) => any`. **If it returns a `Response`, the handler never
  runs.** This is the framework's only validation/short-circuit hook.
- **There is no middleware layer**, so authentication must be invoked explicitly per route.

So CEF's "event" means _AWS event normalization_. The assignment **separately** requires a
Command/Event-oriented application layer (`CreateVacationRequestCommand`,
`VacationRequestApprovedEvent`). Both must exist, and they are different things:

```
HTTP → CEF router (root.yaml) → inputParser (auth + validation) → handler
                                                                     ↓
                                              command bus → command handler
                                                                     ↓
                                              domain rules + TypeORM persistence
                                                                     ↓
                                              event bus → subscribers
```

The README must state this explicitly, because a reviewer checking "did they use CEF" and "did they
use commands/events" is looking for two separate things.

---

## Layer 0 — Scaffold + de-risk ✅

**Goal:** a running CEF server and a pinned database, with the risky unknowns settled before any
domain code exists.

**Delivered**

- `docker-compose.yml` — Postgres `16.4-alpine`, pinned, healthcheck, `.env`-overridable
- `backend/` scaffolded with `npx cef-init`; CEF pinned exactly to `1.0.19`
- `backend/package.json` — `codegen` wired _into_ `dev` so `root.yaml` and the generated registry
  cannot drift
- `backend/tsconfig.json` — `experimentalDecorators` + `emitDecoratorMetadata` for TypeORM
- `.gitignore`, `backend/.env.example` (committed), `backend/.env` (ignored)
- Dependencies: TypeORM, `pg`, `reflect-metadata`, TypeScript `5.9.3`
- Scaffold routes (`/hello`) and `handlers/hello.ts` removed afterwards; `root.yaml` retitled
  _Vacation Request API_ with `paths: {}`. `handlers/types.ts` was kept — it is the
  `HandlerFn` / `InputParserFn` contract every handler implements.

**Verified:** server boots on `:8888`; `/hello` → `200`; `/hello/:name` → `200` (inputParser path
confirmed); unknown route → `404`; `GET /doc/spec` renders OpenAPI from `root.yaml`; `OPTIONS` →
`204` with full CORS headers.

**Findings that changed the plan**

1. **TypeScript pinned to `5.9.3`.** npm resolved TypeScript 7, whose rewritten compiler API breaks
   `ts-node` 10 (`ts.sys` is undefined) — the server would not boot. Pinned to the line CEF itself
   is built against, rather than working around it.
2. **The CORS risk was retired.** CEF's dev server answers preflight with `204` and already allows
   `Authorization`. The Vite proxy is now a convenience, not a necessity.
3. **esbuild `0.15.18` cannot bundle TypeORM** without marking it external. This affects only
   `cef-build` for Lambda, which the assignment does not require; local runs use `ts-node`, where
   decorator metadata works. Declaring explicit `@Column({ type })` costs nothing and keeps that
   path open.
4. **`npm audit` reports 6 vulnerabilities**, all from CEF's own dependency tree (esbuild 0.15,
   `http-server`). Unfixable without diverging from a required dependency → README limitation.
5. **`cef-gen-handlers` does not rewrite the registry when `root.yaml` has zero handler refs** — it
   skips the write entirely. Removing the last scaffold route therefore left a stale
   `HandlerRegistry.ts` still importing the deleted `handlers/hello`, and the project stopped
   typechecking. Codegen reliably _adds_ refs but does not clean up after removals, so after
   deleting a route, verify with `tsc --noEmit` instead of trusting `npm run codegen`.

---

## Layer 1 — Persistence ✅

**Goal:** the schema exists in Postgres and demo users can log in later.

**Delivered**

- `src/entities/User.ts` — `users` table, `UserRole` enum (`Requester` / `Validator`)
- `src/entities/VacationRequest.ts` — `vacation_requests`, `VacationStatus` enum, composite index
- `src/db/dataSource.ts` — connection built lazily, on first call, never at import time
- `src/db/seed.ts` — 3 demo users, bcrypt-hashed, idempotent
- `seed` npm script; `bcryptjs@3` added (ships its own types, so no `@types` package)

**Verified**

| Check                         | Result                                        |
| ----------------------------- | --------------------------------------------- |
| `tsc --noEmit`                | clean                                         |
| Tables created                | `users`, `vacation_requests`                  |
| Column names and types        | match the spec — snake_case, `date`, enums    |
| Composite index               | `btree (user_id, start_date)`                 |
| Foreign key                   | `user_id → users(id) ON DELETE CASCADE`       |
| Seed                          | 3 users created                               |
| Seed re-run                   | all skipped, count still 3                    |
| Passwords                     | 60-char `$2b$10$` bcrypt hashes, no plaintext |
| DB sessions after server boot | **0** — proves the DataSource is lazy         |

That last row is the meaningful one: the server boots and serves `/doc/spec` while holding zero
database sessions, which is exactly what CEF's async `loadEnv()` ordering requires.

**Findings**

1. **Host port moved to 5433.** The seed first failed with `role "vacation" does not exist`. Not a
   credentials problem: a locally installed Homebrew Postgres was bound to `127.0.0.1:5432`, which
   wins `localhost` over Docker's `*:5432`, so TypeORM was talking to the wrong server. The
   container was moved to host port **5433** rather than stopping the local instance. Side benefit:
   a reviewer who already runs Postgres gets a working clone by default. `POSTGRES_PORT` still
   overrides it.
2. **`getEnvValue` is not re-exported from CEF's package root** (only `getAliasEnvValue` is), so it
   must be imported from `commoneventframework/dist/utils/getEnvValue`, as CEF's own README shows.
   It returns `string | undefined`, which assigns cleanly to TypeORM's optional connection options —
   no casts needed.

**Decisions**

- `VacationRequest` carries **both** `userId` and the `user` relation. Creating a request then needs
  only the authenticated user's id (no extra fetch in layer 3), and layer 4 can filter by user
  without a join. Rule: set one or the other on write, never both.
- Date columns are typed as `string`, not `Date`. The `date` column type returns `"YYYY-MM-DD"`,
  which is what makes the layer 3 overlap comparison timezone-proof.

---

## Layer 2 — Authentication + role guard ✅

**Goal:** a token can be obtained, and a route can refuse the wrong caller.

**Files:** `src/auth/jwt.ts`, `src/auth/requireRole.ts`, `src/handlers/auth.ts`, `root.yaml`

**Tasks**

- `jwt.ts`: sign and verify, secret and TTL from env
- `requireRole(event, role?)`: returns the authenticated user, or a CEF `Response` — `401` when the
  bearer token is missing/invalid, `403` on role mismatch. This is the shared primitive every
  protected route's inputParser calls.
- `POST /auth/login` → `{ token, user }`; `GET /auth/me` for frontend bootstrap on reload
- Install `jsonwebtoken`

**Why auth lives in the inputParser:** CEF has no middleware. Putting the guard in
`x-inputParser` makes protection visible in `root.yaml`, keeps handlers as pure business logic, and
uses the framework's own short-circuit instead of inventing a wrapper.

**Verification:** valid credentials return a token; bad password → `401`; protected route with no
token → `401`, with a Requester token where Validator is required → `403`, with the right role →
`200`; `/auth/me` reflects the token's user.

**Exit criteria:** no endpoint can be reached by an unauthorized caller; passwords never appear in
any response.

---

## Layer 3 — Business rules, command/event buses, create ✅

**Goal:** a vacation request can be created, and every rule that governs creation is enforced.

**Files:** `src/domain/vacationRules.ts`, `src/commands/bus.ts`,
`src/commands/CreateVacationRequestCommand.ts`, `src/events/bus.ts`,
`src/handlers/vacationRequests.ts`

**Tasks**

- Each business rule becomes one named pure function in `vacationRules.ts`
- `commands/bus.ts` and `events/bus.ts`: a `Map` plus `dispatch`, roughly 20 lines each —
  deliberately minimal, since the _pattern_ is what's graded, not the plumbing
- `CreateVacationRequestCommand`: validate rules → persist → emit `VacationRequestCreatedEvent`
- `POST /vacation-requests` with an inputParser doing `requireRole('Requester')` + payload shape
  validation

**Verification:** a valid request persists as `Pending`; end-before-start → `400`; a past start date
→ `400`; an overlapping range → `400` with a clear message; a Validator posting here → `403`.

**Exit criteria:** rules 1, 2 and 4 are enforced server-side with distinguishable error messages.

---

## Layer 4 — Read endpoints: filters + pagination ✅

**Goal:** both interfaces can list the data they need, paginated.

**Files:** `src/handlers/vacationRequests.ts`, `root.yaml`

**Tasks**

- `GET /vacation-requests` — the caller's own requests, newest first, paginated
- `GET /vacation-requests/all` — Validator only; filters by `status` and `userId`; paginated
- Both use TypeORM `findAndCount` so the count comes from one query
- Uniform envelope: `{ data, total, page, limit, totalPages }`
- Clamp `limit` to a sane maximum; reject non-numeric paging params in the inputParser

**Verification:** `?status=Pending&userId=…&page=2&limit=5` returns the right slice and totals; a
Requester calling `/all` → `403`; a Requester cannot see another user's rows; out-of-range page
returns an empty `data` rather than an error.

**Exit criteria:** pagination metadata is correct and no cross-user data leaks.

---

## Layer 5 — Approve / reject + domain events + team view ✅

**Goal:** the validator workflow works end to end and emits domain events.

**Files:** `src/commands/{Approve,Reject}VacationRequestCommand.ts`, `src/events/vacationEvents.ts`,
`src/handlers/validation.ts`. The team endpoint ended up in `src/handlers/vacationRequests.ts`
beside the other read endpoints, which is where its pagination and row selection already lived.

**Tasks**

- `ApproveVacationRequestCommand` → emits `VacationRequestApprovedEvent`
- `RejectVacationRequestCommand` — requires a non-empty comment → emits
  `VacationRequestRejectedEvent`
- One subscriber that logs the events. This is an honest extension point: there is no mail service
  in scope, and inventing one would be speculative.
- `PATCH /vacation-requests/:id/approve` and `/reject`, both `requireRole('Validator')`
- `GET /vacation-requests/team` — approved requests across all users, open to both roles

**Why action sub-routes** rather than `PATCH` with a `status` body: they map 1:1 onto the commands,
which keeps the command-oriented architecture visible in the API surface.

**Verification:** approve as Requester → `403`; reject with no comment → `400`; approving an already
`Approved` request → `409`; rejection comment is persisted and returned; the event line appears in
the server log; team endpoint returns only `Approved` rows for both roles.

**Exit criteria:** all 6 business rules enforced; every state transition emits its event.

---

## Layer 6 — Frontend shell ✅

**Goal:** a user can log in through the browser and land on the right interface.

**Files:** `frontend/` — Vite + Vue 3 + TS, `src/api/client.ts`, `src/stores/auth.ts`,
`src/router/index.ts`, `src/views/LoginView.vue`

**Tasks**

- Scaffold Vite + Vue 3 + TypeScript; add Tailwind; Vue Router; Pinia
- Vite dev proxy `/api` → `:8888` to keep dev single-origin
- `api/client.ts`: one Axios instance, request interceptor attaching the bearer token, response
  interceptor logging out on `401`
- `stores/auth.ts`: the **only** Pinia store — token, user, login/logout; token persisted so a
  reload keeps the session. Everything else stays local component state.
- Router guards: unauthenticated → login; authenticated → redirect by role

**Verification:** log in as each demo user in the browser; a guarded route is unreachable when
logged out; a page reload keeps the session; an expired/invalid token logs the user out.

**Exit criteria:** auth works through the real UI; no endpoint is called without a token.

---

## Layer 7 — Requester interface ✅

**Goal:** an employee can submit a request and track it.

**Files:** `frontend/src/views/MyRequestsView.vue`,
`frontend/src/components/{StatusBadge,RequestsTable,Pagination}.vue`. The submit form is a
collapsible panel on the list page rather than a separate `NewRequestView`: submitting refreshes the
list right below it, so a route change would only have cost the user that context.

**Tasks**

- Submit form: start date (required), end date (required), reason (optional)
- Client-side date checks for fast feedback, with **server rule errors rendered verbatim** — the
  server stays the source of truth
- The user's own request list with status badges and pagination
- Extract `StatusBadge`, `RequestsTable` and `Pagination` only because Layer 8 reuses all three

**Verification:** submit a valid request and see it listed as `Pending`; trigger an overlap and see
the server's message in the form; submit a past date and see it refused.

**Exit criteria:** the full requester journey works against the real API.

---

## Layer 8 — Validator interface + team planning ✅

**Goal:** a manager can review, filter and decide.

**Files:** `frontend/src/views/{ValidatorDashboardView,TeamPlanningView}.vue`,
`frontend/src/components/RejectModal.vue`

**Tasks**

- Dashboard listing all requests, reusing `RequestsTable` + `Pagination`
- Filters by status and by user, composable with pagination
- Approve action; reject action through a modal that **cannot submit without a comment**, mirroring
  the server rule
- Team planning view: shared read-only list of approved vacations, reachable by both roles
- Responsive layout via Tailwind

**Verification:** filter by status and by user, paginate through results, approve a request, attempt
a reject with an empty comment (blocked client- and server-side), reject with a comment, then
confirm the requester sees `Rejected` plus the comment; open the team view as both roles.

**Exit criteria:** every Validator requirement in the spec is reachable through the UI.

---

## Layer 9 — Documentation + final verification

**Goal:** a reviewer can clone, run and evaluate the project without asking questions.

**Files:** `README.md`

**Tasks**

- Installation, run and database setup instructions, verified from a clean clone
- Demo user credentials
- **Technical decisions:** CEF as transport vs. our own command/event layer; auth in inputParsers
  because CEF has no middleware; action sub-routes mapping to commands; `synchronize` instead of
  migrations; one Pinia store only
- **Known limitations:** no automated tests; `synchronize: true` rather than migrations; in-process
  event bus (no broker); no refresh tokens; CEF-inherited `npm audit` findings; esbuild/TypeORM
  bundling caveat
- Full end-to-end walkthrough, run once from scratch

**Verification:** `git clean` into a fresh directory, follow the README verbatim, and complete the
whole walkthrough with no undocumented step.

**Exit criteria:** README is accurate and the app runs from a clean clone.

---

# Reference

## API contract

| Method & path                          | Role      | Notes                                 |
| -------------------------------------- | --------- | ------------------------------------- |
| `POST /auth/login`                     | public    | → `{ token, user }`                   |
| `GET /auth/me`                         | any       | frontend bootstrap                    |
| `POST /vacation-requests`              | Requester | → `CreateVacationRequestCommand`      |
| `GET /vacation-requests`               | Requester | own, paginated                        |
| `GET /vacation-requests/all`           | Validator | filters `status`, `userId`; paginated |
| `GET /users`                           | Validator | names for the dashboard filter        |
| `GET /vacation-requests/team`          | both      | approved only                         |
| `PATCH /vacation-requests/:id/approve` | Validator | → `ApproveVacationRequestCommand`     |
| `PATCH /vacation-requests/:id/reject`  | Validator | comment required                      |

Paths use `:id`, not `{id}` — CEF matches with `path-parser`.

## Schema

**users** — `id`, `name`, `email` (unique), `password` (bcrypt), `role`
(`Requester`|`Validator`), `created_at`

**vacation_requests** — `id`, `user_id` → users, `start_date` (date), `end_date` (date), `reason`
(nullable), `status` (`Pending`|`Approved`|`Rejected`, default `Pending`), `comments` (nullable),
`created_at`, `updated_at`

Index on `(user_id, start_date)` — serves both the overlap check and the requester listing. Dates
are stored as `date` (whole days) and compared in UTC.

## Local services

| Service              | Address          | Notes                                        |
| -------------------- | ---------------- | -------------------------------------------- |
| Postgres             | `localhost:5433` | Docker; 5433 avoids a local Postgres on 5432 |
| API (CEF dev server) | `localhost:8888` | `npm run dev` in `backend/`                  |
| Frontend (Vite)      | `localhost:5173` | layer 6 onwards                              |

## Demo users

Seeded by `npm run seed`, all with password `password123`:

| Email                       | Role      |
| --------------------------- | --------- |
| `alice@travelfactory.test`  | Requester |
| `bruno@travelfactory.test`  | Requester |
| `claire@travelfactory.test` | Validator |

## Business rules

| #   | Rule                                         | Enforced in              |
| --- | -------------------------------------------- | ------------------------ |
| 1   | End date must be after start date            | Layer 3                  |
| 2   | No overlapping requests for the same user    | Layer 3                  |
| 3   | Approved requests cannot be modified → `409` | Layer 5                  |
| 4   | Requests in the past are not allowed         | Layer 3                  |
| 5   | A rejected request must have a comment       | Layer 5                  |
| 6   | Only validators may approve or reject        | Layer 2 guard, applied 5 |

Rule 2 checks against `Pending` and `Approved` only — a rejected request must not block a new one.
The overlap test is `start_date <= :end AND end_date >= :start`.

## Conventions

- Handlers stay thin: parse → dispatch command → return. Business logic belongs in commands and
  `domain/vacationRules.ts`.
- Reuse CEF's `Response`, `loadEnv()` and `getEnvValue()`. Do not add response or config helpers.
- `src/generated/HandlerRegistry.ts` is generated — never hand-edited. Every `root.yaml` change
  needs `npm run codegen`, which `npm run dev` runs automatically. Codegen does not clean up after
  a _removed_ route (layer 0, finding 5), so confirm with `tsc --noEmit`.
- Every `@Column` declares an explicit `type`.
- One commit per layer.
