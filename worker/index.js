// worker/index.js
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

// List R2 objects for debugging
app.get('/api/r2-list', async (c) => {
  const list = await c.env.ART_BUCKET.list();
  return c.json(list.objects.map(obj => obj.key));
});

// Serve gallery metadata
app.get('/api/gallery', async (c) => {
  const list = await c.env.ART_BUCKET.list();
  const items = list.objects.map((obj) => ({
    key: obj.key,
    url: `/r2/${encodeURIComponent(obj.key)}`,
  }));
  return c.json(items);
});

// Proxy file access
app.get('/r2/:filename', async (c) => {
  const { filename } = c.req.param();
  const object = await c.env.ART_BUCKET.get(filename);
  if (!object) return c.text('Not found', 404);
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
    },
  });
});

// Upload endpoint
app.put('/api/upload', async (c) => {
  const filename = c.req.query('filename');
  if (!filename) return c.text('Missing filename', 400);
  const contentType = c.req.header('content-type') || 'application/octet-stream';
  const body = await c.req.arrayBuffer();
  await c.env.ART_BUCKET.put(filename, body, { httpMetadata: { contentType } });
  return c.text('Upload successful');
});

// Delete endpoint
app.delete('/api/delete', async (c) => {
  const filename = c.req.query('filename');
  if (!filename) return c.text('Missing filename', 400);
  await c.env.ART_BUCKET.delete(filename);
  return c.text('Deleted');
});

// Rename endpoint
app.post('/api/rename', async (c) => {
  const url = new URL(c.req.url);
  const oldKey = url.searchParams.get('old');
  const newKey = url.searchParams.get('new');
  if (!oldKey || !newKey) return c.text('Missing params', 400);
  const oldObject = await c.env.ART_BUCKET.get(oldKey);
  if (!oldObject) return c.text('File not found', 404);
  await c.env.ART_BUCKET.put(newKey, oldObject.body, { httpMetadata: oldObject.httpMetadata });
  await c.env.ART_BUCKET.delete(oldKey);
  return c.text('Renamed');
});

export default app;
