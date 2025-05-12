// worker/index.js

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jimi421-art.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;
    const method = request.method;

    // 1. CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // 2. PUT /api/upload?group=…&filename=…
    if (method === 'PUT' && pathname === '/api/upload') {
      const group    = searchParams.get('group')    || 'root';
      const filename = searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const key = group === 'root' ? filename : `${group}/${filename}`;
      await env.ART_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: request.headers.get('Content-Type') || 'application/octet-stream' }
      });
      // Optionally track in KV
      const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
      if (!current.includes(key)) {
        current.push(key);
        await env.GALLERY_KV.put('items', JSON.stringify(current));
      }
      return new Response('Uploaded', { status: 200, headers: corsHeaders });
    }

    // 3. GET /api/groups
    if (method === 'GET' && pathname === '/api/groups') {
      const list = await env.ART_BUCKET.list();
      // extract first path segment as group, default to 'root'
      const groups = new Set();
      for (const obj of list.objects) {
        const parts = obj.key.split('/');
        groups.add(parts.length > 1 ? parts[0] : 'root');
      }
      return new Response(
        JSON.stringify(Array.from(groups)),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 4. GET /api/gallery?group=…
    if (method === 'GET' && pathname === '/api/gallery') {
      const group  = searchParams.get('group') || 'root';
      const prefix = group === 'root' ? '' : `${group}/`;
      const list   = await env.ART_BUCKET.list({ prefix });
      const items  = list.objects.map(obj => {
        // strip prefix from key for client display
        const key = prefix ? obj.key.slice(prefix.length) : obj.key;
        return {
          group,
          key,
          url: `/api/image?filename=${encodeURIComponent(obj.key)}`
        };
      });
      return new Response(
        JSON.stringify(items),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // 5. GET /api/image?filename=…
    if (method === 'GET' && pathname === '/api/image') {
      const filename = searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const object = await env.ART_BUCKET.get(filename);
      if (!object) {
        return new Response('Not found', { status: 404, headers: corsHeaders });
      }
      const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
      return new Response(object.body, {
        status: 200,
        headers: { 'Content-Type': contentType, ...corsHeaders }
      });
    }

    // 6. Fallback
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
