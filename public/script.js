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
const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

// 1) Load and render groups
async function loadGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  const groups = await res.json();       // e.g. ["root","trees","houses"]
  const container = document.getElementById('groups');
  container.innerHTML = '';

  groups.forEach(group => {
    const btn = document.createElement('button');
    btn.textContent = group;
    btn.style.marginRight = '0.5rem';
    btn.onclick = () => loadGallery(group);
    container.appendChild(btn);
  });
}

// 2) Upload handler (unchanged)
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const files = document.getElementById('fileInput').files;
  for (const file of files) {
    const uploadURL = `${API_BASE}/api/upload?group=${encodeURIComponent(selectedGroup)}&filename=${encodeURIComponent(file.name)}`;
    await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
  }

  btn.textContent = 'Upload';
  btn.disabled = false;
  document.getElementById('fileInput').value = '';
  loadGallery(selectedGroup);
});

// track currently selected group (default to “root”)
let selectedGroup = 'root';

// 3) Load gallery, optionally filtered by group
async function loadGallery(group = 'root') {
  selectedGroup = group;                     // remember for upload
  const res = await fetch(
    `${API_BASE}/api/gallery?group=${encodeURIComponent(group)}`
  );
  const items = await res.json();

  const container = document.getElementById('gallery');
  container.innerHTML = '';

  items.reverse().forEach(item => {
    const img = document.createElement('img');
    img.src = `${API_BASE}${item.url}`;
    img.className = 'thumb';
    container.appendChild(img);
  });
}

// 4) Initialize both menus on load
window.addEventListener('DOMContentLoaded', () => {
  loadGroups();
  loadGallery();  // shows “root” by default
});

