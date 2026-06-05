export const WORK_ITEM_STATES = ['created', 'active', 'waiting', 'needs_input', 'done'] as const;

export type WorkItemState = (typeof WORK_ITEM_STATES)[number];

export const WORK_ITEM_SOURCES = [
  'email',
  'slack',
  'browser',
  'pr',
  'agent',
  'build',
  'meeting',
  'manual',
] as const;

export type WorkItemSource = (typeof WORK_ITEM_SOURCES)[number];

/** States shown in the primary attention view. */
export const ATTENTION_STATES: readonly WorkItemState[] = ['active', 'needs_input'];

export interface WorkItem {
  id: string;
  title: string;
  state: WorkItemState;
  source: WorkItemSource;
  link: string | null;
  lastTouched: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkItemInput {
  title: string;
  source: WorkItemSource;
  link?: string | null;
  state?: WorkItemState;
}

export interface UpdateWorkItemInput {
  title?: string;
  source?: WorkItemSource;
  link?: string | null;
  state?: WorkItemState;
  touch?: boolean;
}
