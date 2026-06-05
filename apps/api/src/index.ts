import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { createDatabase, runMigrations } from './db/client.js';
import { createItemsRouter } from './routes/items.js';
import { WorkItemRepository } from './repository/work-items.js';

await runMigrations();

const { db } = createDatabase();
const repo = new WorkItemRepository(db);

const app = new Hono();

app.use(
  '*',
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.route('/api/items', createItemsRouter(repo));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }
  if (error instanceof ZodError) {
    return c.json({ error: 'Validation failed', details: error.flatten() }, 400);
  }
  console.error(error);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`);
});

export default app;
