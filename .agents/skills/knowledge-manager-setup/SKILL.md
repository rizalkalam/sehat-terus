---
name: knowledge-manager-setup
description: Manage and synchronize the project's documentation, verify markdown links, and maintain the Obsidian-compatible knowledge base.
---

# Knowledge Manager Setup & Documentation Sync

This workspace skill provides instructions and tools for organizing, validating, and maintaining the project's local knowledge base and Obsidian vault.

## Objective
To ensure that all project planning, research, and phase documents are highly organized, fully cross-referenced, and free of broken links, allowing both human developers (using Obsidian) and AI agents (using Antigravity) to navigate the codebase context effortlessly.

## Structure of the Knowledge Base
The primary knowledge base lives in the `.planning/` directory, which is also configured as an Obsidian vault:
- `.planning/PROJECT.md`: Project scope, constraints, and high-level requirements.
- `.planning/REQUIREMENTS.md`: Detailed functional and non-functional requirements.
- `.planning/ROADMAP.md`: Multi-phase execution roadmap and status checklist.
- `.planning/STATE.md`: Active tracking of current session, plan completion metrics, and session continuity.
- `.planning/research/`: Background technical and architectural studies (e.g., STACK.md, FEATURES.md, PITFALLS.md, PRD.md).
- `.planning/phases/`: Historical and active phase planning directories (e.g., `01-environment-database-bedrock/`, `02-mock-ingestion-geographic-mapping-validation/`).

## How to Maintain the Vault
1. **Always use markdown links** to connect related documents. Use standard relative paths, e.g., `[Roadmap](../ROADMAP.md)`.
2. **Prefer absolute file URIs** for files outside of the planning directory when referencing source code, e.g., `[database.ts](file:///D:/projects/isd-project/sehat-terus/backend/src/config/database.ts)`.
3. **Use the `sync-docs` utility script** to verify link integrity and automatically generate the knowledge base index.

## Running the Sync & Verification Script
To run the sync and link verification tool:
```bash
# Run the sync/verification script using tsx
npx tsx .agents/skills/knowledge-manager-setup/scripts/sync-docs.ts
```

This script will:
- Parse all Markdown files under `.planning/` recursively.
- Validate that all internal markdown links and code file references point to files that actually exist.
- Generate or update `.planning/INDEX.md` (the table of contents for the entire vault).
- Output any broken links or indexing warnings.
