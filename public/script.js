const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

let selectedGroup = 'root'; // track currently selected group

// Load and render groups menu
async function loadGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  const groups = await res.json();
  const container = document.getElementById('groups');
  container.innerHTML = '';

  groups.forEach(group => {
    const btn = document.createElement('button');
    btn.textContent = group;
    btn.style.marginRight = '0.5rem';
    btn.onclick = () => {
      selectedGroup = group;
      loadGallery(group);
    };
    container.appendChild(btn);
  });
}

// Upload files to selected group
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

// Load gallery items in the given group
async function loadGallery(group = 'root') {
  const res = await fetch(`${API_BASE}/api/gallery?group=${encodeURIComponent(group)}`);
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

// Initial load
window.addEventListener('DOMContentLoaded', () => {
  loadGroups();
  loadGallery();
});
