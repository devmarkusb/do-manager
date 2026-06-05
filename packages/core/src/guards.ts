import type { WorkItemSource, WorkItemState } from './types.js';

export function isWorkItemState(value: string): value is WorkItemState {
  return (
    value === 'created' ||
    value === 'active' ||
    value === 'waiting' ||
    value === 'needs_input' ||
    value === 'done'
  );
}

export function isWorkItemSource(value: string): value is WorkItemSource {
  return (
    value === 'email' ||
    value === 'slack' ||
    value === 'browser' ||
    value === 'pr' ||
    value === 'agent' ||
    value === 'build' ||
    value === 'meeting' ||
    value === 'manual'
  );
}
