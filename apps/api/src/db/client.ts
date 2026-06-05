import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import fs from 'node:fs';
import path from 'node:path';
import * as schema from './schema.js';

const DEFAULT_DB_PATH = './data/do-manager.db';

export function resolveDatabasePath(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DB_PATH;
}

function toFileUrl(dbPath: string): string {
  const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.resolve(dbPath);
  return `file:${absolutePath}`;
}

export function createDatabase(dbPath = resolveDatabasePath()) {
  const dir = path.dirname(dbPath);
  fs.mkdirSync(dir, { recursive: true });

  const client = createClient({ url: toFileUrl(dbPath) });
  const db = drizzle(client, { schema });
  return { db, client };
}

export type AppDatabase = ReturnType<typeof createDatabase>['db'];

export async function runMigrations(dbPath = resolveDatabasePath()) {
  const migrationsFolder = path.join(import.meta.dirname, '../../drizzle');
  const { db, client } = createDatabase(dbPath);
  await migrate(db, { migrationsFolder });
  client.close();
}
