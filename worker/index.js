// worker/index.js

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://jimi421-art.pages.dev',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ——— 1. CORS preflight ———
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // ——— 2. Upload: PUT /api/upload?group=G&filename=F ———
    if (request.method === 'PUT' && url.pathname === '/api/upload') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
      const key = `${group}/${filename}`;
      console.log(`🔼 Uploading: ${key}`);
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

    // ——— 3. Gallery list: GET /api/gallery ———
    if (request.method === 'GET' && url.pathname === '/api/gallery') {
      console.log(`📋 Listing gallery`);
      const list = await env.ART_BUCKET.list();
      const items = list.objects.map(obj => ({
        key: obj.key,
        url: `/api/image?filename=${encodeURIComponent(obj.key)}`
      }));
      return new Response(JSON.stringify(items), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ——— 4. Serve image: GET /api/image?filename=XYZ.jpg ———
    if (request.method === 'GET' && url.pathname === '/api/image') {
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
      try {
        const object = await env.ART_BUCKET.get(filename);
        if (!object) {
          return new Response('Not found', {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
        const contentType = object.httpMetadata?.contentType || 'image/jpeg';
        return new Response(object.body, {
          status: 200,
          headers: { 'Content-Type': contentType, ...corsHeaders }
        });
      } catch (err) {
        console.error(`❌ Error serving ${filename}:`, err);
        return new Response('Error retrieving file', {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
      }
    }

    // ——— 5. Metadata: GET /api/metadata?group=G&filename=F ———
    if (request.method === 'GET' && url.pathname === '/api/metadata') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const key = `${group}/${filename}`;
      const data = await env.METADATA_KV.get(key);
      return new Response(data || '{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ——— 6. Metadata: PUT /api/metadata?group=G&filename=F ———
    if (request.method === 'PUT' && url.pathname === '/api/metadata') {
      const group = url.searchParams.get('group') || 'root';
      const filename = url.searchParams.get('filename');
      if (!filename) {
        return new Response('Missing filename', { status: 400, headers: corsHeaders });
      }
      const key = `${group}/${filename}`;
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
      }
      await env.METADATA_KV.put(key, JSON.stringify(body));
      return new Response('Metadata saved', {
        status: 200,
        headers: { 'Content-Type': 'text/plain', ...corsHeaders }
      });
    }

    // ——— 7. Debug: GET /api/debug ———
    if (request.method === 'GET' && url.pathname === '/api/debug') {
      const list = await env.ART_BUCKET.list();
      const keys = list.objects.map(o => o.key);
      return new Response(JSON.stringify({ keys }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ——— 8. Fallback ———
    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};
