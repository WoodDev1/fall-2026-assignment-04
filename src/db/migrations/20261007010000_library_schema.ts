import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema.createTable('borrowers')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('user_id', 'integer', c => c.notNull().unique().references('users.id').onDelete('cascade'))
    .addColumn('card_number', 'varchar(255)', c => c.notNull().unique())
    .addColumn('registered_at', 'timestamp', c => c.notNull().defaultTo(sql`NOW()`))
    .execute();
  await db.schema.createTable('books')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('isbn', 'varchar(255)', c => c.notNull().unique())
    .addColumn('title', 'varchar(255)', c => c.notNull())
    .addColumn('published_year', 'integer')
    .execute();
  await db.schema.createTable('authors')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('name', 'varchar(255)', c => c.notNull())
    .execute();
  await db.schema.createTable('genres')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('name', 'varchar(255)', c => c.notNull().unique())
    .execute();
  await db.schema.createTable('book_authors')
    .addColumn('book_id', 'integer', c => c.notNull().references('books.id').onDelete('cascade'))
    .addColumn('author_id', 'integer', c => c.notNull().references('authors.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('book_authors_pkey', ['book_id', 'author_id'])
    .execute();
  await db.schema.createTable('book_genres')
    .addColumn('book_id', 'integer', c => c.notNull().references('books.id').onDelete('cascade'))
    .addColumn('genre_id', 'integer', c => c.notNull().references('genres.id').onDelete('cascade'))
    .addPrimaryKeyConstraint('book_genres_pkey', ['book_id', 'genre_id'])
    .execute();
  await db.schema.createTable('loans')
    .addColumn('id', 'serial', c => c.primaryKey())
    .addColumn('borrower_id', 'integer', c => c.notNull().references('borrowers.id').onDelete('cascade'))
    .addColumn('book_id', 'integer', c => c.notNull().references('books.id').onDelete('cascade'))
    .addColumn('borrowed_at', 'timestamp', c => c.notNull().defaultTo(sql`NOW()`))
    .addColumn('due_at', 'timestamp', c => c.notNull())
    .addColumn('returned_at', 'timestamp')
    .addCheckConstraint('loans_due_after_borrowing', sql`due_at >= borrowed_at`)
    .addCheckConstraint('loans_return_after_borrowing', sql`returned_at IS NULL OR returned_at >= borrowed_at`)
    .execute();
  for (const [table, column] of [
    ['book_authors', 'author_id'], ['book_genres', 'genre_id'],
    ['loans', 'borrower_id'], ['loans', 'book_id'],
  ]) {
    await db.schema.createIndex(`${table}_${column}_idx`).on(table).column(column).execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const table of ['loans', 'book_genres', 'book_authors', 'genres', 'authors', 'books', 'borrowers']) {
    await db.schema.dropTable(table).execute();
  }
}
