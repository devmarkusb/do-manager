import { describe, expect, it } from 'vitest';
import { WORK_ITEM_SOURCES } from '@do-manager/core';

describe('web bootstrap', () => {
  it('exposes all work item sources for the create form', () => {
    expect(WORK_ITEM_SOURCES).toContain('pr');
    expect(WORK_ITEM_SOURCES).toContain('agent');
  });
});
