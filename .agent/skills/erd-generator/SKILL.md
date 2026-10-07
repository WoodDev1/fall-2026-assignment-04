---
name: erd-generator
description: Design or revise a Mermaid entity relationship diagram from domain requirements, validate its syntax locally, and render an SVG. Use for ERDs, relational data models, or database architecture diagrams.
---

# ERD generator

Work from the repository root. Read existing migrations before designing the model; preserve existing tables and key types. Resolve business rules about ownership, optionality, uniqueness, and many-to-many relationships. Ask only when an unresolved choice materially changes the model; otherwise document reasonable assumptions.

1. Identify entities, attributes, PKs, FKs, and cardinalities. Use snake_case names and explicit join entities for many-to-many relationships. Give every FK a relationship line identifying its parent. Mark unique fields with UK and describe required/nullable fields in attribute comments. Match the existing `users` schema if it appears in the diagram.
2. Write a standalone `erDiagram` to `docs/architecture/schema.mmd`, without Markdown fences. Keep business decisions in `docs/architecture/library-design.md` or an appropriately named design note.
3. Run `node .agent/skills/erd-generator/scripts/render_erd.js docs/architecture/schema.mmd` from the repository root. The script lives inside this skill, not in a root `scripts/` directory.
4. On `SYNTAX_ERROR`, inspect the stderr trace, fix the source, and rerun. Allow the initial attempt plus at most three correction attempts. Do not treat an installation or browser-launch failure as malformed Mermaid: report the environment issue after diagnosing it. Never claim success from an old SVG.
5. After exit code 0 and `SUCCESS`, present the raw Mermaid in a code block and link `docs/architecture/erd.svg`. If the retry limit is reached, report the final trace and leave the source available for repair.
