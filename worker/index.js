// worker/index.js

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jimi421-art.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Upload handler with group support
    if (request.method === 'PUT' && url.pathname === '/api/upload') {
      const filename = url.searchParams.get('filename');
      const group = url.searchParams.get('group') || 'root';
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
      const key = `${group}/${filename}`;
      console.log(`🔼 Uploading: ${key}`);
      await env.ART_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType: request.headers.get('Content-Type') || 'application/octet-stream'
        }
      });
      return new Response('Uploaded', { status: 200, headers: corsHeaders });
    }

    // Gallery list by group
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      const group = url.searchParams.get('group') || 'root';
      const list = await env.ART_BUCKET.list({ prefix: `${group}/` });
      const items = list.objects.map(obj => ({
        key: obj.key.split('/')[1],
        url: `/api/image?filename=${encodeURIComponent(obj.key)}`
      }));
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // List all groups (from R2 object prefixes)
    if (request.method === 'GET' && url.pathname === '/api/groups') {
      const list = await env.ART_BUCKET.list();
      const groups = new Set();
      for (const obj of list.objects) {
        const prefix = obj.key.split('/')[0];
        if (prefix) groups.add(prefix);
      }
      return new Response(JSON.stringify([...groups]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Serve image
    if (request.method === 'GET' && url.pathname === '/api/image') {
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
      const object = await env.ART_BUCKET.get(filename);
      if (!object) {
        return new Response('Not found', { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
      }
      const contentType = object.httpMetadata?.contentType || 'image/jpeg';
      return new Response(object.body, {
        status: 200,
        headers: { 'Content-Type': contentType, ...corsHeaders }
      });
    }

    // Debug
    if (request.method === 'GET' && url.pathname === '/api/debug') {
      const list = await env.ART_BUCKET.list();
      const keys = list.objects.map(o => o.key);
      return new Response(JSON.stringify({ keys }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Fallback
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
