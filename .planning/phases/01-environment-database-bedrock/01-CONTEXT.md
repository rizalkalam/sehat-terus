# Phase 1: Environment & Database Bedrock - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Establishing a containerized development environment with PostgreSQL and Next.js, setting up Prisma ORM, and configuring the base database schema with B-Tree indexes.

</domain>

<decisions>
## Implementation Decisions

### Package Manager
- **D-01:** Use **npm** as the package manager for the project (handles dependency locks and matches default script templates).

### PostgreSQL Container Configuration
- **D-02:** Expose PostgreSQL port **5432** directly to the host machine to allow external database clients and Prisma Studio to connect easily.

### TypeScript and Linter Configuration
- **D-03:** Enable full strict TypeScript compiler checks (`strict: true`) in tsconfig.json to catch type issues early.
- **D-04:** Use standard Next.js ESLint linting configuration without custom strict rules to prevent build blocks for minor warnings during development.

### the agent's Discretion
- Downstream planning/executing agents have flexibility over specific multi-stage Dockerfile configurations and the precise Next.js App Router folders structure, provided standard conventions and requirements are followed.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Definitions
- `.planning/PROJECT.md` — Core value, constraints, active requirements, and key decisions.
- `.planning/REQUIREMENTS.md` — All v1 and v2 requirements, exclusions, and traceability mappings.
- `.planning/ROADMAP.md` — Decomposes requirements into 4 phases and sets phase-specific success criteria.

### Specs & Requirements
- `.planning/research/PRD.md` — The original project Product Requirement Document (PRD).

### Domain Research
- `.planning/research/SUMMARY.md` — Informs tech choices, expected features, component boundaries, and phase ordering.
- `.planning/research/STACK.md` — Detailed research on stable 2026 stack choices (Next.js 15.2.x, React 19, react-leaflet 5, Recharts 3.8.1).
- `.planning/research/FEATURES.md` — Detailed features matrix (table stakes, differentiators, out-of-scope).
- `.planning/research/ARCHITECTURE.md` — Component boundaries, data flow pipelines, and build order.
- `.planning/research/PITFALLS.md` — Critical pitfalls (Leaflet SSR dynamic import, population density mapping normalization, subdistrict name mismatches).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None (Greenfield project starting from scratch).

### Established Patterns
- None (Greenfield project starting from scratch).

### Integration Points
- None (Greenfield project starting from scratch).

</code_context>

<specifics>
## Specific Ideas

- No specific requirements – open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

- None – discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Environment & Database Bedrock*
*Context gathered: 2026-06-17*
