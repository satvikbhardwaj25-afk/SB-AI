# SB.ai

SB.ai is an open-source, no-login AI chatbot with a dark bluish interface and a Gemini-powered JSON API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `GEMINI_API_KEY` — Gemini provider key stored in Replit Secrets

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/sb-ai/` — React/Vite frontend
- `artifacts/api-server/src/routes/chat.ts` — live `/api/chat` Gemini route
- `lib/api-spec/openapi.yaml` — source-of-truth JSON API contract
- `python-api/main.py` — dependency-free Python implementation of the same API
- `python-api/openapi.json` — standalone JSON API document for the Python implementation

## Architecture decisions

- No account or database is required; the browser owns the current conversation state.
- The model is configurable with `GEMINI_MODEL`, defaulting to the currently supported `gemini-3-flash-preview`.
- Gemini calls stay server-side so the provider key is never exposed to browser code.
- The Python API uses only the standard library so it can run without a virtual environment or dependency install.

## Product

- Start chatting immediately without registration.
- Keep a conversation in the current browser tab.
- Send the full conversation context to Gemini and display provider errors clearly.
- Copy assistant replies and start a fresh conversation.

## User preferences

- The user requested a simple dark bluish theme, no login, open-source code, Python support, and Gemini-powered chat.

## Gotchas

- `GEMINI_API_KEY` must exist for `/api/chat`; model calls intentionally fail explicitly when it is missing.
- `gemini-3-flash-preview` is used instead of the requested "Gemini 3.6 Flash" label because the former is the supported provider model identifier.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
