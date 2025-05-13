// script.js
const API_BASE = 'https://jimi421-art.jimi421.workers.dev';
let filesToUpload = [], selectedGroup = 'root';

// ——— GROUP FILTERS ———
async function loadGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  const groups = await res.json();
  const wrap = document.getElementById('groupButtons');
  wrap.innerHTML = '';

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.textContent = 'All';
  allBtn.className = 'group-btn';
  allBtn.onclick = () => selectGroup('root');
  wrap.appendChild(allBtn);

  groups.forEach(g => {
    const btn = document.createElement('button');
    btn.textContent = g;
    btn.className = 'group-btn';
    btn.onclick = () => selectGroup(g);
    wrap.appendChild(btn);
  });

  highlightActiveGroup();
}

function selectGroup(g) {
  selectedGroup = g;
  highlightActiveGroup();
  loadGallery();
}

function highlightActiveGroup() {
  document.querySelectorAll('.group-btn').forEach(btn => {
    const label = (selectedGroup === 'root') ? 'All' : selectedGroup;
    btn.classList.toggle('active', btn.textContent === label);
  });
}

// ——— GALLERY ———
async function loadGallery() {
  const res = await fetch(`${API_BASE}/api/gallery?group=${encodeURIComponent(selectedGroup)}`);
  const items = await res.json();
  const grid = document.getElementById('gallery');
  grid.innerHTML = '';

  items.reverse().forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';

    const isVideo = /\.(mp4|mov|webm)$/i.test(item.key);
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = `${API_BASE}${item.url}`;
    if (isVideo) media.controls = true;
    media.className = 'media';
    media.onclick = () => openImageModal(media.src);

    card.appendChild(media);
    grid.appendChild(card);
  });
}

// ——— IMAGE MODAL ———
function openImageModal(src) {
  document.getElementById('modalImage').src = src;
  document.getElementById('imageModal').classList.add('active');
}
function closeImageModal() {
  document.getElementById('imageModal').classList.remove('active');
}

// ——— UPLOAD MODAL UI ———
document.getElementById('openUpload').onclick = () =>
  document.getElementById('uploadModal').classList.add('active');

document.getElementById('closeUploadModal').onclick = () => {
  document.getElementById('uploadModal').classList.remove('active');
  filesToUpload = [];
  document.getElementById('previewGrid').innerHTML = '';
};

// drag & drop
const dropzone = document.getElementById('dropzone');
dropzone.onclick    = () => document.getElementById('fileInput').click();
dropzone.ondragover = e => { e.preventDefault(); dropzone.classList.add('hover'); };
dropzone.ondragleave= () => dropzone.classList.remove('hover');
dropzone.ondrop     = e => {
  e.preventDefault();
  dropzone.classList.remove('hover');
  filesToUpload = Array.from(e.dataTransfer.files);
  renderPreviewGrid();
};
document.getElementById('fileInput').onchange = e => {
  filesToUpload = Array.from(e.target.files);
  renderPreviewGrid();
};

// ——— PREVIEW GRID ———
function renderPreviewGrid() {
  const preview = document.getElementById('previewGrid');
  preview.innerHTML = '';
  filesToUpload.forEach((file, i) => {
    const reader = new FileReader();
    reader.onload = () => {
      const div = document.createElement('div');
      div.className = 'preview';

      const img = document.createElement('img');
      img.src = reader.result;
      div.appendChild(img);

      // remove
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.onclick = () => {
        filesToUpload.splice(i, 1);
        renderPreviewGrid();
      };
      div.appendChild(rm);

      // rotate
      const rt = document.createElement('button');
      rt.textContent = '⟳';
      rt.className = 'rotate-btn';
      rt.onclick = () => rotateImage(i, reader.result, file);
      div.appendChild(rt);

      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function rotateImage(index, dataURL, file) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const image = new Image();
  image.onload = () => {
    canvas.width  = image.height;
    canvas.height = image.width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.width/2, -image.height/2);
    canvas.toBlob(blob => {
      filesToUpload[index] = new File([blob], file.name, { type: file.type });
      renderPreviewGrid();
    }, file.type);
  };
  image.src = dataURL;
}

// ——— UPLOAD ACTION ———
document.getElementById('uploadBtn').onclick = async () => {
  if (!filesToUpload.length) return;
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  for (const file of filesToUpload) {
    await fetch(
      `${API_BASE}/api/upload?group=${encodeURIComponent(selectedGroup)}&filename=${encodeURIComponent(file.name)}`,
      { method: 'PUT', headers: { 'Content-Type': file.type }, body: file }
    );
  }

  btn.disabled = false;
  btn.textContent = 'Upload';
  document.getElementById('closeUploadModal').click();
  loadGallery();
  showToast('Upload complete!');
};

// ——— TOAST ———
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ——— INIT ———
window.addEventListener('DOMContentLoaded', () => {
  loadGroups();
  loadGallery();
  document.getElementById('closeImageModal').onclick = closeImageModal;
});

