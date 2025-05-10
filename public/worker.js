export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      const list = await env.ART_BUCKET.list({ prefix: '' });
      const items = list.objects.map(obj => ({
        key: obj.key,
        url: `https://${env.ART_BUCKET.bucketName}.r2.cloudflarestorage.com/${obj.key}`
      }));
      return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && url.pathname === '/api/get-upload-url') {
      const { filename, contentType } = await request.json();
      const { uploadURL } = env.ART_BUCKET.getPresignedUrl({
        key: filename,
        httpMetadata: { contentType }
      });
      return new Response(JSON.stringify({ uploadURL }), { headers: { 'Content-Type': 'application/json' } });
    }

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
