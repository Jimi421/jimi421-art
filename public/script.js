const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

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

async function loadGallery() {
  const res = await fetch(`${API_BASE}/api/gallery`);
  const items = await res.json();
  const container = document.getElementById('gallery');
  container.innerHTML = '';
  items.reverse().forEach(item => {
    const img = document.createElement('img');
    img.src = item.url;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

window.addEventListener('DOMContentLoaded', loadGallery);
