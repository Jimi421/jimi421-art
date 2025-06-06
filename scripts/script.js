// script.js
const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

let allItems = [];       // holds { key, url, title, tags, favorite }
let currentGroup = 'all';

async function loadGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  const groups = await res.json();
  const container = document.getElementById('groupButtons');
  container.innerHTML = '';

  // “All” button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'group-btn active';
  allBtn.onclick = () => selectGroup('all', allBtn);
  container.appendChild(allBtn);

  // Existing groups from KV
  groups.sort().forEach(g => {
    const btn = document.createElement('button');
    btn.textContent = g;
    btn.className = 'group-btn';
    btn.onclick = () => selectGroup(g, btn);
    container.appendChild(btn);
  });

  // ALWAYS add “Uncategorized” (root) so that any photo
  // without an explicit group still appears in the filter list
  const uncategorizedBtn = document.createElement('button');
  uncategorizedBtn.textContent = 'Uncategorized';
  uncategorizedBtn.className = 'group-btn';
  uncategorizedBtn.onclick = () => selectGroup('root', uncategorizedBtn);
  container.appendChild(uncategorizedBtn);
}

function selectGroup(group, btn) {
  currentGroup = group;
  document.querySelectorAll('.group-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderGallery();
}

function setupFilters() {
  document.getElementById('filterFavorites').addEventListener('change', renderGallery);
  document.getElementById('searchInput').addEventListener('input', renderGallery);
}

async function loadGallery() {
  // 1. Fetch gallery list from the Worker
  const res = await fetch(`${API_BASE}/api/gallery`);
  const items = await res.json();

  // 2. For each object, pull its metadata
  allItems = await Promise.all(items.reverse().map(async item => {
    const filename = item.key.split('/').pop();
    // If there's no slash, treat it as “root” (Uncategorized)
    const group = item.key.includes('/') ? item.key.split('/')[0] : 'root';
    let meta = {};
    try {
      const m = await fetch(`${API_BASE}/api/metadata?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`);
      if (m.ok) meta = await m.json();
    } catch {}
    return {
      key: item.key,
      url: `${API_BASE}${item.url}`,
      title: meta.title || filename,
      tags: Array.isArray(meta.tags) ? meta.tags : [],
      favorite: !!meta.favorite,
      group
    };
  }));

  renderGallery();
}

function renderGallery() {
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  const favOnly = document.getElementById('filterFavorites').checked;
  const term = document.getElementById('searchInput').value.trim().toLowerCase();

  // FILTER 1: group fallback to 'root' if missing
  let items = allItems.filter(it => {
    const group = it.group || 'root';
    return currentGroup === 'all' || group === currentGroup;
  });

  // FILTER 2: favorite checkbox
  if (favOnly) items = items.filter(it => it.favorite);

  // FILTER 3: search by title or tags
  if (term) {
    items = items.filter(it =>
      it.title.toLowerCase().includes(term) ||
      it.tags.some(t => t.toLowerCase().includes(term))
    );
  }

  if (!items.length) {
    container.innerHTML = '<p style="text-align:center;">No matches.</p>';
    return;
  }

  items.forEach(it => {
    const card = document.createElement('div');
    card.className = 'card' + (it.favorite ? ' favorited' : '');

    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';

    const media = document.createElement(it.url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'img');
    media.src = it.url;
    if (media.tagName === 'VIDEO') media.controls = true;
    media.className = 'media';

    const star = document.createElement('div');
    star.className = 'favorite-star';
    star.textContent = '⭐';

    wrapper.append(media, star);
    card.append(wrapper);

    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = it.title;
    card.append(caption);

    card.onclick = () => {
      window.location.href =
        `/photo.html?group=${encodeURIComponent(it.group || 'root')}&filename=${encodeURIComponent(it.key.split('/').pop())}`;
    };

    container.append(card);
  });
}

// ——— Upload modal logic (unchanged) ———
let filesToUpload = [];
document.getElementById('openUpload').onclick = () => document.getElementById('uploadModal').classList.add('active');
document.getElementById('closeModal').onclick = () => {
  document.getElementById('uploadModal').classList.remove('active');
  filesToUpload = [];
  document.getElementById('previewGrid').innerHTML = '';
  document.getElementById('dropzone').textContent = 'Drag & drop files here or click to select';
};
document.getElementById('dropzone').onclick = () => document.getElementById('fileInput').click();
document.getElementById('dropzone').ondragover = e => { e.preventDefault(); e.currentTarget.classList.add('hover'); };
document.getElementById('dropzone').ondragleave = e => e.currentTarget.classList.remove('hover');
document.getElementById('dropzone').ondrop = e => {
  e.preventDefault();
  e.currentTarget.classList.remove('hover');
  filesToUpload = Array.from(e.dataTransfer.files);
  renderPreviewGrid();
};
document.getElementById('fileInput').onchange = e => {
  filesToUpload = Array.from(e.target.files);
  renderPreviewGrid();
};
document.getElementById('uploadBtn').onclick = async () => {
  if (!filesToUpload.length) return;
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  for (const file of filesToUpload) {
    const url = `${API_BASE}/api/upload?group=${encodeURIComponent(document.getElementById('groupSelect').value)}&filename=${encodeURIComponent(file.name)}`;
    await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  }
  btn.disabled = false;
  btn.textContent = 'Upload';
  document.getElementById('closeModal').click();
  await loadGallery();
  showToast('Upload complete!');
};

function renderPreviewGrid() {
  const previewGrid = document.getElementById('previewGrid');
  previewGrid.innerHTML = '';
  filesToUpload.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = () => {
      const div = document.createElement('div');
      div.className = 'preview';
      const img = document.createElement('img');
      img.src = reader.result;
      div.append(img);
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.onclick = () => { filesToUpload.splice(i,1); renderPreviewGrid(); showToast('Removed'); };
      div.append(removeBtn);
      previewGrid.append(div);
    };
    reader.readAsDataURL(file);
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Initialize everything
window.addEventListener('DOMContentLoaded', async () => {
  await loadGroups();
  await loadGallery();
  setupFilters();
});
