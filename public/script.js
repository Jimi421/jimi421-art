const API_BASE = 'https://jimi421-art.YOUR_SUBDOMAIN.workers.dev'; // Replace with real value after deploy

async function loadGallery() {
  const res = await fetch(`${API_BASE}/api/gallery`);
  const items = await res.json();
  const container = document.getElementById('gallery');
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = item.url;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const files = document.getElementById('fileInput').files;
  for (const file of files) {
    const { uploadURL } = await fetch(`${API_BASE}/api/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type })
    }).then(r => r.json());

    await fetch(uploadURL, { method: 'PUT', body: file });

    await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name })
    });
  }
  loadGallery();
});

window.addEventListener('DOMContentLoaded', loadGallery);
