import type { WorkItem, WorkItemSource, WorkItemState } from '@do-manager/core';
import { WORK_ITEM_SOURCES } from '@do-manager/core';

const API_BASE = '';

export async function fetchAttentionItems(): Promise<WorkItem[]> {
  const response = await fetch(`${API_BASE}/api/items?view=attention`);
  if (!response.ok) throw new Error('Failed to load attention items');
  const data = (await response.json()) as { items: WorkItem[] };
  return data.items;
}

export async function createWorkItem(input: {
  title: string;
  source: WorkItemSource;
  link?: string;
  state?: WorkItemState;
}): Promise<WorkItem> {
  const response = await fetch(`${API_BASE}/api/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error('Failed to create item');
  const data = (await response.json()) as { item: WorkItem };
  return data.item;
}

export async function updateWorkItemState(id: string, state: WorkItemState): Promise<WorkItem> {
  const response = await fetch(`${API_BASE}/api/items/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  });
  if (!response.ok) throw new Error('Failed to update item');
  const data = (await response.json()) as { item: WorkItem };
  return data.item;
}

export { WORK_ITEM_SOURCES };
