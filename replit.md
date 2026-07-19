# StadiumAI — FIFA World Cup 2026

GenAI-enabled stadium operations platform for fans, organizers, volunteers, and venue staff across all 16 FIFA World Cup 2026 stadiums in the USA, Canada, and Mexico.

## Run & Operate

- `pnpm --filter @workspace/stadium-ai run dev` — run the frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/api-server run test` — run the full test suite (114 tests)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key (server-side only, never exposed to client)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TanStack Query, wouter, framer-motion, Tailwind CSS
- API: Express 5 with `express-rate-limit` (50 AI requests / 15min / IP)
- AI: Google Gemini 2.5 Flash via `@google/genai` SDK — server-side proxy, key never sent to browser
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Testing: Vitest — 114 tests across 4 test files, all pure functions (no DB/network required)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — DB tables: incidents, venues, conversations, messages
- `artifacts/api-server/src/routes/` — API route handlers (ai, incidents, venues, dashboard, conversations)
- `artifacts/api-server/src/lib/` — testable pure function modules:
  - `ai-prompts.ts` — prompt builders for all 8 AI modules
  - `incident-classifier.ts` — rule-based incident triage fallback
  - `carbon-calculator.ts` — transport emissions + sustainability math
  - `crowd-utils.ts` — crowd density risk levels, route scoring, dispersal time
  - `ai-client.ts` — secure Gemini wrapper (reads `GEMINI_API_KEY` server-side)
- `artifacts/api-server/src/__tests__/` — 4 test files, 114 tests
- `artifacts/stadium-ai/src/` — React frontend pages + components

## Architecture decisions

- **Server-side AI proxy**: `GEMINI_API_KEY` is read only by the Express server. The browser never sees it. Rate limiting is applied at the route level (`express-rate-limit`).
- **Rule-based fallbacks**: All 3 AI endpoints (triage, crowd analysis, translation) have deterministic rule-based fallbacks. If Gemini fails or times out, the endpoint still returns a useful response.
- **Contract-first API**: All endpoints are defined in OpenAPI YAML first, then Orval generates both React Query hooks (for the frontend) and Zod schemas (for server-side validation).
- **Pure-function test targets**: Business logic (prompt builders, incident classification, carbon math, crowd scoring) lives in `src/lib/` as pure functions with zero dependencies on Express, DB, or network. This makes them fast to test and easy to maintain.
- **8 AI modules**: navigation, crowd, accessibility, transport, sustainability, multilingual, ops, volunteer — each with a dedicated system prompt.

## Product

Four role-based views built on a single platform:
- **Fan Portal** (`/`) — AI chat with 4 modules (navigation, accessibility, transport, multilingual), persistent conversation history, live venue capacity status, SOS emergency button
- **Operations Dashboard** (`/ops`) — live incident feed with priority colors, AI-powered incident triage, crowd density analysis, dashboard stats
- **Volunteer Hub** (`/volunteer`) — venue assignments with occupancy bars, AI helper for volunteer questions
- **Sustainability Tracker** (`/sustainability`) — carbon saved metrics, venue capacity stats, AI broadcast translator for eco messages

## User preferences

_Populate as you build._

## Gotchas

- Never add `GEMINI_API_KEY` to the frontend — it must stay server-side only
- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before modifying routes
- Test files are excluded from `tsc` typecheck (`tsconfig.json` excludes `**/*.test.ts`) but run fine under Vitest
- `pnpm --filter @workspace/api-server run test` runs all 4 test files; individual files: `vitest run src/__tests__/crowd-utils.test.ts`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
