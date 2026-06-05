import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workItems = sqliteTable('work_items', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  state: text('state').notNull(),
  source: text('source').notNull(),
  link: text('link'),
  lastTouched: text('last_touched').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export type WorkItemRow = typeof workItems.$inferSelect;
export type NewWorkItemRow = typeof workItems.$inferInsert;
