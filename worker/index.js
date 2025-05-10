export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET /api/gallery → return list of images
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      const list = await env.ART_BUCKET.list({ prefix: '' });
      const items = list.objects.map(obj => ({
        key: obj.key,
        url: `https://${env.ART_BUCKET.bucketName}.r2.cloudflarestorage.com/${obj.key}`
      }));
      return new Response(JSON.stringify(items), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/get-upload-url → get a signed R2 upload URL
    if (request.method === 'POST' && url.pathname === '/api/get-upload-url') {
      const { filename, contentType } = await request.json();
      const uploadURL = await env.ART_BUCKET.createPresignedUrl({
        method: 'PUT',
        key: filename,
        httpMetadata: { contentType },
        expiration: 15 * 60 // 15 minutes
      });
      return new Response(JSON.stringify({ uploadURL }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // POST /api/register → save filename in KV
    if (request.method === 'POST' && url.pathname === '/api/register') {
      const { filename } = await request.json();
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      current.push(filename);
      await env.GALLERY_KV.put('items', JSON.stringify(current));
      return new Response('OK');
    }

    return new Response('Not Found', { status: 404 });
  }
};
