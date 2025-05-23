// index.js (Cloudflare Worker)
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jimi421-art.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Get list of groups
    if (request.method === 'GET' && url.pathname === '/api/groups') {
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      const groups = [...new Set(current.map(k => k.split('/')[0] || 'root'))];
      return new Response(JSON.stringify(groups), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Upload
    if (request.method === 'PUT' && url.pathname === '/api/upload') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) return new Response('Missing filename', { status: 400, headers: corsHeaders });
      const key = `${group}/${filename}`;
      await env.ART_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
      });
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      if (!current.includes(key)) {
        current.push(key);
        await env.GALLERY_KV.put('items', JSON.stringify(current));
      }
      return new Response('Uploaded', { status: 200, headers: corsHeaders });
    }

    // List gallery
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      const list = await env.ART_BUCKET.list();
      const items = list.objects.map(o => ({
        key: o.key,
        url: `/api/image?filename=${encodeURIComponent(o.key)}`
      }));
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Serve image
    if (request.method === 'GET' && url.pathname === '/api/image') {
      const filename = url.searchParams.get('filename');
      if (!filename) return new Response('Missing filename', { status: 400, headers: corsHeaders });
      const obj = await env.ART_BUCKET.get(filename);
      if (!obj) return new Response('Not found', { status: 404, headers: corsHeaders });
      return new Response(obj.body, {
        status: 200,
        headers: { 'Content-Type': obj.httpMetadata.contentType || 'image/jpeg', ...corsHeaders }
      });
    }

    // Get metadata
    if (request.method === 'GET' && url.pathname === '/api/metadata') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) return new Response('Missing filename', { status: 400, headers: corsHeaders });
      const key = `${group}/${filename}`;
      const data = await env.METADATA_KV.get(key);
      return new Response(data || '{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Save metadata
    if (request.method === 'PUT' && url.pathname === '/api/metadata') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) return new Response('Missing filename', { status: 400, headers: corsHeaders });
      const key = `${group}/${filename}`;
      const body = await request.json();
      await env.METADATA_KV.put(key, JSON.stringify(body));
      return new Response('Metadata saved', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      });
    }

    // Debug
    if (request.method === 'GET' && url.pathname === '/api/debug') {
      const list = await env.ART_BUCKET.list();
      return new Response(JSON.stringify({ keys: list.objects.map(o => o.key) }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
