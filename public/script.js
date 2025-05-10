const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

// Upload handler
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const files = document.getElementById('fileInput').files;
  for (const file of files) {
    const uploadURL = `${API_BASE}/api/upload?filename=${encodeURIComponent(file.name)}`;
    await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
  }

  btn.textContent = 'Upload';
  btn.disabled = false;
  document.getElementById('fileInput').value = '';
  loadGallery();
});

// Load gallery from Worker
async function loadGallery() {
  // 1) Fetch the list from your Worker
  const res = await fetch(`${API_BASE}/api/gallery`);
  const items = await res.json();

  // 2) Clear and render
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  // Show newest first
  items.reverse().forEach(item => {
    const img = document.createElement('img');
    // 🔑 prefix with API_BASE so it hits your Worker
    img.src = `${API_BASE}${item.url}`;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

// Initial load
window.addEventListener('DOMContentLoaded', loadGallery);
