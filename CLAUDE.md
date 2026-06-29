# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Vite dev server — uses mock API, no Claude calls, no cost
npm run build          # TypeScript check (tsc -b) + Vite production build
npm run lint           # ESLint
npm run test           # Run all tests once (vitest)
npm run test:watch     # Vitest in watch mode
npm run test:coverage  # Coverage report
npm run preview        # Preview the production build locally
```

To run a single test file:
```bash
npx vitest run src/lib/__tests__/generateDocx.test.ts
npx vitest run api/__tests__/buildTailorResult.test.ts
```

**Never hit the real API during development** — `npm run dev` skips the Vercel function entirely and returns mock data. Running against the real `/api/tailor` endpoint calls Claude and costs money.

## Architecture

React/TypeScript/Vite SPA deployed on Vercel. The user pastes a job description → a Vercel serverless function calls Claude Haiku → the frontend renders a tailored resume preview → the user exports a `.docx` file.

### Data flow

```
resume-pool.json  ──┐
                    ├──► App.tsx ──► src/lib/tailor.ts ──► POST /api/tailor ──► Claude (Haiku)
JD text (user)   ──┘                       │
                                           └── (DEV: returns mock data, skips API)
```

### Key files

**`resume-pool.json`** — single source of truth for all resume content. Contains `contact`, `summary_variants` (each with `id`, `tags`, `text`), `skills` (each with `name`, `category`, `tags`), `bullets` (each with `id`, `company`, `title`, `dates`, `label`, `text`, `tags`, `quantified`, `priority`), and `education`. Imported directly by the frontend — edit here to change resume content, no build needed.

**`api/tailor.ts`** — Vercel serverless function. Calls Claude Haiku with the JD + pool, parses the JSON response, delegates post-processing to `buildTailorResult`. Requires `ANTHROPIC_API_KEY` in the Vercel environment.

**`api/buildTailorResult.ts`** — pure function extracted from the handler. Reconstructs full bullet objects from IDs (applying `modifiedBullets` text overrides), enforces the skill/bullet consistency rule (any skill name appearing in a selected bullet's text is added to `selectedSkills` even if the model omitted it), and resolves the chosen summary variant. This is the logic most critical for ATS correctness and is fully unit-tested.

**`src/lib/tailor.ts`** — thin client. In `DEV` mode skips the fetch and returns hardcoded mock data (first 6 bullets, first 10 skills) after a 1.2s delay. In production, POSTs `{ jd, pool }` to `/api/tailor`.

**`src/lib/generateDocx.ts`** — builds and returns a DOCX `Blob` using the `docx` npm package. Page is US Letter with 0.75" margins; tab stops are computed from `TEXT_WIDTH = PAGE_WIDTH - 2 * MARGIN` so dates flush exactly to the right margin. Exports three pure helpers used internally and tested independently: `groupBulletsByCompany`, `groupSkillsByCategory`, `buildContactLine`.

**`src/App.tsx`** — state machine: `idle → loading → results`. Holds `result: TailorResponse | null`.

**`src/components/ResultsView.tsx`** — renders the tailored resume preview and the sticky "Export DOCX ↓" button. On export, calls `generateDocx(result, pool)` → Blob → download as `name-resume.docx`.

### Key types (`src/types/index.ts`)

- `ResumePool` — shape of `resume-pool.json`
- `TailorResponse` — `{ selectedBullets, selectedSkills, summary, matchScore, extractedKeywords, injectedKeywords }`
- `AppState` — `'idle' | 'loading' | 'results'`

### Prompt design (`api/tailor.ts`)

Claude is instructed to: extract JD keywords → select 6–8 bullets (prefer quantified, penalize pure DevOps for non-infra roles) → pick the best-matching summary variant → filter skills to JD-relevant only → inject up to 3 missing keywords into bullets (only when substantively applicable) → return strict JSON (no markdown).

The post-processing consistency rule in `buildTailorResult` compensates for the model sometimes omitting skills that appear in its own selected bullet text.

### Tests

Vitest with jsdom. Two test files:
- `src/lib/__tests__/generateDocx.test.ts` — covers the three pure helpers and that `generateDocx` returns a non-empty Blob
- `api/__tests__/buildTailorResult.test.ts` — covers the eight ATS-critical invariants (modified bullet text, missing bullet IDs, skill consistency rule, summary fallback, passthrough fields)

The `api/` directory is not included in any `tsconfig` (only `src/` is type-checked by `tsc -b`). Vitest handles TypeScript for both `src/` and `api/` test files via its own bundler.
