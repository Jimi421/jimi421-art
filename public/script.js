const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

// Display previews for selected files
document.getElementById('fileInput').addEventListener('change', function () {
  const files = this.files;
  const container = document.getElementById('preview');
  container.innerHTML = '';
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'thumb';
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
});

// Upload files and refresh gallery
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
  document.getElementById('preview').innerHTML = '';
  loadGallery();
});

// Load gallery from Worker
async function loadGallery() {
  const res = await fetch(`${API_BASE}/api/gallery`);
  const items = await res.json();
  const container = document.getElementById('gallery');
  container.innerHTML = '';
  // Show newest first
  items.reverse().forEach(item => {
    const img = document.createElement('img');
    img.src = item.url;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

// On page load
window.addEventListener('DOMContentLoaded', loadGallery);
