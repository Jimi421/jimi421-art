// worker/index.js - extended with groups and metadata
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

    // ---- Groups list ----
    if (request.method === 'GET' && url.pathname === '/api/groups') {
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      const groups = [...new Set(current.map(k => k.split('/')[0] || 'root'))];
      return new Response(JSON.stringify(groups), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ---- Upload file ----
    if (request.method === 'PUT' && url.pathname === '/api/upload') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const key = `${group}/${filename}`;
      await env.ART_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: request.headers.get('Content-Type') || 'application/octet-stream'
        }
      });
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      if (!current.includes(key)) {
        current.push(key);
        await env.GALLERY_KV.put('items', JSON.stringify(current));
      }
      return new Response('Uploaded', { status: 200, headers: corsHeaders });
    }

    // ---- Gallery listing ----
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      const group = url.searchParams.get('group');
      const options = group ? { prefix: `${group}/` } : {};
      const list = await env.ART_BUCKET.list(options);
      const items = list.objects.map(o => ({
        key: o.key,
        url: `/api/image?group=${encodeURIComponent(o.key.split('/')[0])}&filename=${encodeURIComponent(o.key.split('/').slice(1).join('/'))}`
      }));
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ---- Serve image ----
    if (request.method === 'GET' && url.pathname === '/api/image') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const key = `${group}/${filename}`;
      const object = await env.ART_BUCKET.get(key);
      if (!object) {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }
      const type = object.httpMetadata?.contentType || 'application/octet-stream';
      return new Response(object.body, {
        status: 200,
        headers: { 'Content-Type': type, ...corsHeaders }
      });
    }

    // ---- Get metadata ----
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

    // ---- Save metadata ----
    if (request.method === 'PUT' && url.pathname === '/api/metadata') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) return new Response('Missing filename', { status: 400, headers: corsHeaders });
      const key = `${group}/${filename}`;
      const body = await request.json();
      await env.METADATA_KV.put(key, JSON.stringify(body));
      return new Response('Metadata saved', { status: 200, headers: corsHeaders });
    }

    // ---- Debug listing ----
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
