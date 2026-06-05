import { WORK_ITEM_SOURCES, WORK_ITEM_STATES } from '@do-manager/core';
import { z } from 'zod';

export const createWorkItemSchema = z.object({
  title: z.string().trim().min(1).max(500),
  source: z.enum(WORK_ITEM_SOURCES),
  link: z.string().url().nullable().optional(),
  state: z.enum(WORK_ITEM_STATES).optional(),
});

export const updateWorkItemSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    source: z.enum(WORK_ITEM_SOURCES).optional(),
    link: z.string().url().nullable().optional(),
    state: z.enum(WORK_ITEM_STATES).optional(),
    touch: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  });

export const listQuerySchema = z.object({
  view: z.enum(['attention', 'all']).optional().default('attention'),
  state: z.enum(WORK_ITEM_STATES).optional(),
});
