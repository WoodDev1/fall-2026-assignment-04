---
name: kysely-migration-generator
description: Translate a validated Mermaid ERD in docs/architecture into a PostgreSQL Kysely TypeScript migration with foreign keys, uniqueness, and dependency-safe rollback.
---

# Kysely migration generator

Read the requested `.mmd` or `.svg` in `docs/architecture`, the design decisions, `package.json`, and all existing migrations. Prefer the matching Mermaid source when given an SVG. If only SVG is available, use visible entity fields and relationship labels; ask for missing key or cardinality information instead of guessing from coordinates. Verify the source with the ERD renderer before translation.

## Translation rules

- Convert entities and attributes to snake_case table and column names. Produce a table/column/key/dependency mapping before writing code. Existing tables, especially `users` from `001_initial_schema.ts`, must be referenced rather than recreated or dropped. Preserve their key types and constraints.
- Map `int` to `integer`, `bigint` to `bigint`, `string` to `varchar(255)` (honor documented lengths), `text` to `text`, `boolean` to `boolean`, `date` to `date`, `timestamp` to `timestamp`, `timestamptz` to `timestamptz`, `uuid` to `uuid`, and `decimal` to a documented `numeric(p,s)`. Resolve unsupported types before generation.
- A new single integer PK uses `serial` (or `bigserial` for bigint) and `.primaryKey()`. A UUID PK uses `.primaryKey().defaultTo(sql`gen_random_uuid()`)` on the provided PostgreSQL 17. FK integers remain `integer`, never `serial`. Composite PKs use `.addPrimaryKeyConstraint()`; do not auto-generate components of a join key.
- Map each FK to `.references('parent.key').onDelete('cascade')`, using the actual referenced key. Mark required attributes and mandatory parent references `.notNull()`. A parent having zero children does not make the child's FK nullable.
- `PARENT ||--o{ CHILD` means one parent per child and zero or more children per parent: FK belongs on the child. `PARENT ||--o| CHILD` has the same required parent FK plus `.unique()` on that FK, enforcing at most one child per parent. Reverse-oriented relationships must be interpreted by their endpoint markers, not text order. UK attributes become `.unique()`; composite uniqueness needs a table constraint. Many-to-many relationships require a join table with two FKs and a composite PK or unique pair.
- Preserve documented defaults, nullable fields, lengths, and check constraints. Index FKs used in lookups. Do not invent unique constraints on descriptive names such as author names.

## Output and validation

Create `src/db/migrations/<UTC_YYYYMMDDHHmmss>_<migration_name>.ts` with a timestamp later than previous migrations and a meaningful snake_case name. Export `async function up(db: Kysely<any>): Promise<void>` and `async function down(db: Kysely<any>): Promise<void>`. Import `Kysely` and `sql` from `kysely` as needed.

Create new parent tables before dependent tables in `up`; drop only this migration's tables in the exact reverse dependency order in `down`. For cycles, create tables first and add FKs afterward, with the inverse rollback. Do not modify historical migrations that may already have run.

Run `npm run build`, then `npm run migrate:up` against the authorized local development database. Fix failures before reporting success. Verify rollback and reapplication against a disposable database or when a rollback is authorized and will not destroy needed data. Report separately which checks passed and which were blocked by the environment. Return the migration path and the assumptions used.
