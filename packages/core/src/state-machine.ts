import type { WorkItemState } from './types.js';

/** Valid transitions for the attention-focused workflow. */
export const ATTENTION_TRANSITIONS: Record<WorkItemState, readonly WorkItemState[]> = {
  created: ['active', 'waiting', 'needs_input', 'done'],
  active: ['waiting', 'needs_input', 'done'],
  waiting: ['active', 'needs_input', 'done'],
  needs_input: ['active', 'waiting', 'done'],
  done: [],
};

/** Includes reopening from done for manual correction. */
export const ALL_TRANSITIONS: Record<WorkItemState, readonly WorkItemState[]> = {
  ...ATTENTION_TRANSITIONS,
  done: ['active', 'waiting', 'needs_input'],
};

export function canTransition(
  from: WorkItemState,
  to: WorkItemState,
  allowReopen = false,
): boolean {
  const map = allowReopen ? ALL_TRANSITIONS : ATTENTION_TRANSITIONS;
  return map[from].includes(to);
}

export function transition(
  from: WorkItemState,
  to: WorkItemState,
  allowReopen = false,
): WorkItemState {
  if (!canTransition(from, to, allowReopen)) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
  return to;
}
