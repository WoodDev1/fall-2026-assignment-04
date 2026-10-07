import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Kysely, PostgresDialect, sql } from 'kysely';
import * as initial from '../src/db/migrations/001_initial_schema.js';
import * as library from '../src/db/migrations/20261007010000_library_schema.js';

// Use a caller-supplied disposable PostgreSQL database only.
// Never point TEST_DATABASE_URL at a database containing needed data.
test('library constraints, cascade deletion, rollback, and reapplication', {
  skip: !process.env.TEST_DATABASE_URL,
}, async () => {
  const { default: pg } = await import('pg');
  const db = new Kysely<any>({ dialect: new PostgresDialect({
    pool: new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL }),
  }) });
  try {
    await initial.up(db);
    await library.up(db);
    const user = await db.insertInto('users').values({ email: 'reader@example.test' }).returning('id').executeTakeFirstOrThrow();
    const borrower = await db.insertInto('borrowers').values({ user_id: user.id, card_number: 'CARD-1' }).returning('id').executeTakeFirstOrThrow();
    await assert.rejects(db.insertInto('borrowers').values({ user_id: user.id, card_number: 'CARD-2' }).execute());
    const book = await db.insertInto('books').values({ isbn: '9780000000001', title: 'Example' }).returning('id').executeTakeFirstOrThrow();
    await assert.rejects(db.insertInto('loans').values({ borrower_id: -1, book_id: book.id, due_at: '2099-01-01' }).execute());
    await assert.rejects(db.insertInto('loans').values({ borrower_id: borrower.id, book_id: book.id, borrowed_at: '2026-10-07', due_at: '2026-10-06' }).execute());
    await db.insertInto('loans').values({ borrower_id: borrower.id, book_id: book.id, due_at: '2099-01-01' }).execute();
    const author = await db.insertInto('authors').values({ name: 'Example Author' }).returning('id').executeTakeFirstOrThrow();
    await db.insertInto('book_authors').values({ book_id: book.id, author_id: author.id }).execute();
    await assert.rejects(db.insertInto('book_authors').values({ book_id: book.id, author_id: author.id }).execute());
    await db.deleteFrom('users').where('id', '=', user.id).execute();
    assert.equal((await db.selectFrom('borrowers').selectAll().execute()).length, 0);
    assert.equal((await db.selectFrom('loans').selectAll().execute()).length, 0);
    await library.down(db);
    assert.equal((await sql<{ name: string }>`SELECT tablename AS name FROM pg_tables WHERE schemaname = 'public'`.execute(db)).rows.some(r => r.name === 'users'), true);
    await library.up(db);
    await library.down(db);
    await initial.down(db);
  } finally {
    await db.destroy();
  }
});
