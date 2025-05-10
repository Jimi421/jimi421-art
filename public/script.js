const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

// 🖼 Preview selected images before upload
document.getElementById('fileInput').addEventListener('change', function () {
  const files = this.files;
  const container = document.getElementById('gallery');
  container.innerHTML = ''; // Optional: reset
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

// 🚀 Upload each file to Worker via PUT
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const files = document.getElementById('fileInput').files;
  for (const file of files) {
    const uploadURL = `${API_BASE}/api/upload?filename=${encodeURIComponent(file.name)}`;
    await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
  }
  loadGallery();
});

// 🧱 Load gallery from Worker / R2
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

// ⏱ Load on page open
window.addEventListener('DOMContentLoaded', loadGallery);
