import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { WorkItemRepository } from '../repository/work-items.js';
import { createWorkItemSchema, listQuerySchema, updateWorkItemSchema } from './schemas.js';

export function createItemsRouter(repo: WorkItemRepository) {
  const app = new Hono();

  app.get('/', async (c) => {
    const query = listQuerySchema.parse(c.req.query());
    const items =
      query.state !== undefined
        ? await repo.listByStates([query.state])
        : query.view === 'all'
          ? await repo.listAll()
          : await repo.listAttention();

    return c.json({ items });
  });

  app.get('/:id', async (c) => {
    const item = await repo.getById(c.req.param('id'));
    if (!item) throw new HTTPException(404, { message: 'Work item not found' });
    return c.json({ item });
  });

  app.post('/', async (c) => {
    const body = createWorkItemSchema.parse(await c.req.json());
    const item = await repo.create(body);
    return c.json({ item }, 201);
  });

  app.patch('/:id', async (c) => {
    const body = updateWorkItemSchema.parse(await c.req.json());
    try {
      const item = await repo.update(c.req.param('id'), body);
      if (!item) throw new HTTPException(404, { message: 'Work item not found' });
      return c.json({ item });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Invalid transition')) {
        throw new HTTPException(409, { message: error.message });
      }
      throw error;
    }
  });

  app.delete('/:id', async (c) => {
    const deleted = await repo.delete(c.req.param('id'));
    if (!deleted) throw new HTTPException(404, { message: 'Work item not found' });
    return c.body(null, 204);
  });

  return app;
}
