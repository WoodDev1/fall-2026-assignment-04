# Library business decisions

- `users` is already created by `001_initial_schema.ts`; its definition in the ERD documents that existing table.
- A user may have zero or one borrower profile. Every borrower belongs to exactly one user and has a unique library card number.
- A book row represents a catalog title/edition with a unique ISBN, not a physical copy. A title can be borrowed by multiple borrowers concurrently; inventory and copy tracking are outside this example's scope.
- Books may have multiple authors and genres. Join tables permit zero or more of each and prevent duplicate pairs. Author names are not unique; genre names are unique.
- Each loan belongs to exactly one borrower and book. Borrowed and due timestamps are required; returned time is nullable until return. Due and returned times cannot precede borrowing.
- A borrower may borrow the same title repeatedly; no uniqueness is imposed on the borrower/book pair. No overdue policy or active-loan limit is assumed.
- Foreign keys cascade on deletion as required by this assignment. A production library could instead retain loan history with restricted deletion or soft deletion.
- New entity IDs use serial integers to match the starter's users key. Join tables use composite integer keys. Required fields are stated in attribute comments in the ERD.

## Demonstration prompts for Antigravity

1. Use erd-generator to design a library management ERD with users, books, genres, authors, borrowers, and loans. Users already exists as in 001_initial_schema.ts. Use the business decisions above, including one borrower profile per user, many-to-many authors/genres, and catalog-level lending. Validate and render docs/architecture/schema.mmd.
2. Use kysely-migration-generator to translate docs/architecture/schema.mmd into a new migration. Preserve existing users, use serial integer IDs and composite join keys, enforce the stated nullability and loan date checks, and verify build plus migration execution.

The committed artifacts demonstrate the pipeline output. Running these prompts in `agy` is a separate registration/invocation check; do not infer that it ran from the presence of these files.
