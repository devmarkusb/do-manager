import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createDatabase, runMigrations } from '../db/client.js';
import { WorkItemRepository } from '../repository/work-items.js';

const TEST_DATA_DIR = path.join(process.cwd(), 'data', 'test');

describe('WorkItemRepository', () => {
  let dbPath: string;
  let repo: WorkItemRepository;

  beforeEach(async () => {
    fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    dbPath = path.join(TEST_DATA_DIR, `work-items-${randomSuffix()}.db`);
    await runMigrations(dbPath);
    repo = new WorkItemRepository(createDatabase(dbPath).db);
  });

  afterEach(() => {
    if (fs.existsSync(dbPath)) fs.rmSync(dbPath, { force: true });
  });

  it('creates and lists attention items', async () => {
    await repo.create({ title: 'Review PR #123', source: 'pr', state: 'active' });
    await repo.create({ title: 'Build #567', source: 'build', state: 'waiting' });

    const attention = await repo.listAttention();
    expect(attention).toHaveLength(1);
    expect(attention[0]?.title).toBe('Review PR #123');
  });

  it('rejects invalid state transitions', async () => {
    const item = await repo.create({ title: 'Slack thread', source: 'slack', state: 'waiting' });
    await expect(repo.update(item.id, { state: 'created' })).rejects.toThrow(/Invalid transition/);
  });
});

function randomSuffix(): string {
  return Math.random().toString(36).slice(2);
}
