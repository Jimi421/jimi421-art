const API_BASE = 'https://jimi421-art.jimi421.workers.dev'; // 👈 Your live Worker URL

// Load the image gallery from the backend
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

// Handle file upload
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const files = document.getElementById('fileInput').files;
  for (const file of files) {
    // 1. Get a signed R2 upload URL
    const { uploadURL } = await fetch(`${API_BASE}/api/get-upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type })
    }).then(r => r.json());

    // 2. Upload the file to R2
    await fetch(uploadURL, {
      method: 'PUT',
      body: file
    });

    // 3. Register the file in KV
    await fetch(`${API_BASE}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name })
    });
  }

  // Refresh gallery after upload
  loadGallery();
});

// Load gallery on page load
window.addEventListener('DOMContentLoaded', loadGallery);
