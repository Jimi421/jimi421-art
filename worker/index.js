const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://jimi421-art.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  export default {
    async fetch(request, env) {
      const url = new URL(request.url);
  
      // 1. CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
      }
  
      // 2. Upload image to group: PUT /api/upload?group=trees&filename=IMG.jpg
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
        await env.ART_BUCKET.put(key, request.body, {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream'
          }
        });
        console.log(`✅ Uploaded: ${key}`);
        return new Response('Uploaded', { status: 200, headers: corsHeaders });
      }
  
      // 3. List all groups: GET /api/groups
      if (request.method === 'GET' && url.pathname === '/api/groups') {
        const list = await env.ART_BUCKET.list();
        const groups = new Set();
        list.objects.forEach(obj => {
          const [grp] = obj.key.split('/');
          groups.add(grp);
        });
        return new Response(JSON.stringify(Array.from(groups)), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
  
      // 4. List images in a group: GET /api/gallery?group=trees
      if (request.method === 'GET' && url.pathname === '/api/gallery') {
        const group = url.searchParams.get('group') || 'root';
        const prefix = `${group}/`;
        const list = await env.ART_BUCKET.list({ prefix });
        const items = list.objects.map(obj => {
          const name = obj.key.substring(prefix.length);
          return {
            key: name,
            url: `/api/image?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(name)}`
          };
        });
        return new Response(JSON.stringify(items), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
  
      // 5. Serve image: GET /api/image?group=trees&filename=IMG.jpg
      if (request.method === 'GET' && url.pathname === '/api/image') {
        const group = url.searchParams.get('group') || 'root';
        const filename = url.searchParams.get('filename');
        if (!filename) {
          return new Response('Missing filename', {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
          });
        }
        const key = `${group}/${filename}`;
        const object = await env.ART_BUCKET.get(key);
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
      }
  
      // 6. Fallback for unknown routes
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
  };
  