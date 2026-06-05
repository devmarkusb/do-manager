import { randomUUID } from 'node:crypto';
import {
  ATTENTION_STATES,
  canTransition,
  type CreateWorkItemInput,
  type UpdateWorkItemInput,
  type WorkItem,
  type WorkItemState,
} from '@do-manager/core';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { AppDatabase } from '../db/client.js';
import { workItems } from '../db/schema.js';

function nowIso(): string {
  return new Date().toISOString();
}

function rowToWorkItem(row: typeof workItems.$inferSelect): WorkItem {
  return {
    id: row.id,
    title: row.title,
    state: row.state as WorkItem['state'],
    source: row.source as WorkItem['source'],
    link: row.link,
    lastTouched: row.lastTouched,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class WorkItemRepository {
  constructor(private readonly db: AppDatabase) {}

  async listAttention(): Promise<WorkItem[]> {
    return this.listByStates([...ATTENTION_STATES]);
  }

  async listByStates(states: WorkItemState[]): Promise<WorkItem[]> {
    if (states.length === 0) return [];

    const rows = await this.db
      .select()
      .from(workItems)
      .where(inArray(workItems.state, states))
      .orderBy(desc(workItems.lastTouched));

    return rows.map(rowToWorkItem);
  }

  async listAll(): Promise<WorkItem[]> {
    const rows = await this.db.select().from(workItems).orderBy(desc(workItems.lastTouched));
    return rows.map(rowToWorkItem);
  }

  async getById(id: string): Promise<WorkItem | null> {
    const rows = await this.db.select().from(workItems).where(eq(workItems.id, id)).limit(1);
    const row = rows[0];
    return row ? rowToWorkItem(row) : null;
  }

  async create(input: CreateWorkItemInput): Promise<WorkItem> {
    const timestamp = nowIso();
    const item: WorkItem = {
      id: randomUUID(),
      title: input.title.trim(),
      state: input.state ?? 'active',
      source: input.source,
      link: input.link ?? null,
      lastTouched: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.db.insert(workItems).values({
      id: item.id,
      title: item.title,
      state: item.state,
      source: item.source,
      link: item.link,
      lastTouched: item.lastTouched,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });

    return item;
  }

  async update(id: string, input: UpdateWorkItemInput): Promise<WorkItem | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const nextState = input.state ?? existing.state;
    if (input.state && !canTransition(existing.state, input.state, true)) {
      throw new Error(`Invalid transition: ${existing.state} → ${input.state}`);
    }

    const timestamp = nowIso();
    const updated: WorkItem = {
      ...existing,
      title: input.title?.trim() ?? existing.title,
      source: input.source ?? existing.source,
      link: input.link !== undefined ? input.link : existing.link,
      state: nextState,
      lastTouched: input.touch === false ? existing.lastTouched : timestamp,
      updatedAt: timestamp,
    };

    await this.db
      .update(workItems)
      .set({
        title: updated.title,
        source: updated.source,
        link: updated.link,
        state: updated.state,
        lastTouched: updated.lastTouched,
        updatedAt: updated.updatedAt,
      })
      .where(eq(workItems.id, id));

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(workItems).where(eq(workItems.id, id));
    return result.rowsAffected > 0;
  }

  async countByState(state: WorkItemState): Promise<number> {
    const rows = await this.db
      .select()
      .from(workItems)
      .where(and(eq(workItems.state, state)));
    return rows.length;
  }
}
