import { describe, expect, it } from 'vitest';
import { ATTENTION_STATES, canTransition, transition } from './index.js';

describe('state machine', () => {
  it('defines attention states', () => {
    expect(ATTENTION_STATES).toEqual(['active', 'needs_input']);
  });

  it('allows active → waiting', () => {
    expect(canTransition('active', 'waiting')).toBe(true);
    expect(transition('active', 'waiting')).toBe('waiting');
  });

  it('blocks done → active without reopen', () => {
    expect(canTransition('done', 'active')).toBe(false);
    expect(() => transition('done', 'active')).toThrow();
  });

  it('allows reopen from done when enabled', () => {
    expect(canTransition('done', 'active', true)).toBe(true);
  });

  it('blocks invalid jumps', () => {
    expect(canTransition('waiting', 'created')).toBe(false);
  });
});
