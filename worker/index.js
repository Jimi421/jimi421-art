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
  
      // ✅ Upload image to R2
      if (request.method === 'PUT' && url.pathname === '/api/upload') {
        const filename = url.searchParams.get('filename');
        if (!filename) {
          return new Response('Missing filename', { status: 400, headers: corsHeaders });
        }
  
        await env.ART_BUCKET.put(filename, request.body, {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream'
          }
        });
  
        const current = JSON.parse(await env.GALLERY_KV.get('items') || '[]');
        if (!current.includes(filename)) {
          current.push(filename);
          await env.GALLERY_KV.put('items', JSON.stringify(current));
        }
  
        console.log(`✅ Uploaded: ${filename}`);
        return new Response('Uploaded', { status: 200, headers: corsHeaders });
      }
  
      // ✅ Return gallery image list
      if (request.method === 'GET' && url.pathname === '/api/gallery') {
        const list = await env.ART_BUCKET.list();
        const filenames = list.objects.map(obj => obj.key);
        console.log('🧾 Files in R2:', filenames);
  
        const items = filenames.map(key => ({
          key,
          url: `/api/image?filename=${encodeURIComponent(key)}`
        }));
  
        return new Response(JSON.stringify(items), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
  
      // ✅ Serve image directly
      if (request.method === 'GET' && url.pathname === '/api/image') {
        const filename = url.searchParams.get('filename');
        if (!filename) {
          return new Response('Missing filename', { status: 400, headers: corsHeaders });
        }
  
        const object = await env.ART_BUCKET.get(filename);
        if (!object) {
          console.log(`🛑 Not found in R2: ${filename}`);
          return new Response('Not found', { status: 404, headers: corsHeaders });
        }
  
        const type = object.httpMetadata?.contentType || 'image/jpeg';
  
        return new Response(object.body, {
          headers: {
            'Content-Type': type,
            ...corsHeaders
          }
        });
      }
  
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
  };
  
  