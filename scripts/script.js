// public/scripts/script.js

const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

let filesToUpload = [];
let currentGroup = 'all';

const refs = {
  groupButtons: document.getElementById('groupButtons'),
  gallery: document.getElementById('gallery'),
  searchInput: document.getElementById('searchInput'),
  filterFavorites: document.getElementById('filterFavorites'),
  openUpload: document.getElementById('openUpload'),
  closeModal: document.getElementById('closeModal'),
  uploadModal: document.getElementById('uploadModal'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  previewGrid: document.getElementById('previewGrid'),
  uploadBtn: document.getElementById('uploadBtn'),
  newGroupInput: document.getElementById('newGroupInput'),
  groupSelect: document.getElementById('groupSelect')
};

async function loadGroups() {
  const res = await fetch(`${API_BASE}/api/groups`);
  const groups = await res.json();
  refs.groupButtons.innerHTML = '';

  // "All" button
  const allBtn = document.createElement('button');
  allBtn.className = 'group-btn active';
  allBtn.textContent = 'All';
  allBtn.onclick = () => {
    currentGroup = 'all';
    setActiveGroup(allBtn);
    loadGallery();
  };
  refs.groupButtons.appendChild(allBtn);

  // One button per group
  groups.sort().forEach(group => {
    const btn = document.createElement('button');
    btn.className = 'group-btn';
    btn.textContent = group;
    btn.onclick = () => {
      currentGroup = group;
      setActiveGroup(btn);
      loadGallery();
    };
    refs.groupButtons.appendChild(btn);
  });
}

function setActiveGroup(activeBtn) {
  document.querySelectorAll('.group-btn').forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

async function loadGallery() {
  // Fetch entire gallery
  const res = await fetch(`${API_BASE}/api/gallery`);
  let items = await res.json();

  // 1) Filter by group
  if (currentGroup !== 'all') {
    items = items.filter(item => item.key.startsWith(`${currentGroup}/`));
  }

  // Reverse so newest first
  items = items.reverse();

  // Prepare search + favorites filters
  const q = refs.searchInput.value.trim().toLowerCase();
  const favOnly = refs.filterFavorites.checked;

  refs.gallery.innerHTML = '';

  for (const item of items) {
    const filename = item.key.split('/').pop();
    const groupName = item.key.includes('/') ? item.key.split('/')[0] : 'root';

    // Fetch metadata
    let meta = {};
    try {
      const m = await fetch(`${API_BASE}/api/metadata?group=${encodeURIComponent(groupName)}&filename=${encodeURIComponent(filename)}`);
      if (m.ok) meta = await m.json();
    } catch (e) {
      console.warn('Meta load failed for', filename, e);
    }

    const title = (meta.title || filename).trim();
    const tags = Array.isArray(meta.tags) ? meta.tags : [];
    const isFav = Boolean(meta.favorite);

    // 2) Filter by favorites checkbox
    if (favOnly && !isFav) continue;

    // 3) Filter by search term
    if (q) {
      const hay = [ title.toLowerCase(), ...tags.map(t => t.toLowerCase()) ];
      if (!hay.some(field => field.includes(q))) continue;
    }

    // Build the card
    const card = document.createElement('div');
    card.className = 'card';
    if (isFav) card.classList.add('favorited');

    const wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';

    const isVideo = /\.(mp4|mov|webm)$/i.test(item.key);
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = `${API_BASE}/api/image?filename=${encodeURIComponent(item.key)}`;
    if (isVideo) media.controls = true;
    media.className = 'media';

    // star icon
    const star = document.createElement('div');
    star.className = 'favorite-star';
    star.textContent = '⭐';

    wrapper.appendChild(media);
    wrapper.appendChild(star);
    card.appendChild(wrapper);

    const caption = document.createElement('div');
    caption.className = 'caption';
    caption.textContent = title;
    card.appendChild(caption);

    card.onclick = () => {
      window.location.href =
        `/photo.html?group=${encodeURIComponent(groupName)}&filename=${encodeURIComponent(filename)}`;
    };

    refs.gallery.appendChild(card);
  }
}

function initUploadUI() {
  refs.openUpload.onclick = () => refs.uploadModal.classList.add('active');
  refs.closeModal.onclick = () => {
    refs.uploadModal.classList.remove('active');
    filesToUpload = [];
    refs.previewGrid.innerHTML = '';
    refs.dropzone.textContent = 'Drag & drop files here or click to select';
  };

  refs.dropzone.onclick = () => refs.fileInput.click();
  refs.dropzone.ondragover = e => { e.preventDefault(); refs.dropzone.classList.add('hover'); };
  refs.dropzone.ondragleave = e => refs.dropzone.classList.remove('hover');
  refs.dropzone.ondrop = e => {
    e.preventDefault();
    refs.dropzone.classList.remove('hover');
    filesToUpload = Array.from(e.dataTransfer.files);
    renderPreviewGrid();
  };
  refs.fileInput.onchange = e => {
    filesToUpload = Array.from(e.target.files);
    renderPreviewGrid();
  };
  refs.uploadBtn.onclick = async () => {
    if (!filesToUpload.length) return;
    const btn = refs.uploadBtn;
    btn.disabled = true;
    btn.textContent = 'Uploading...';
    for (const file of filesToUpload) {
      const url = `${API_BASE}/api/upload?group=${encodeURIComponent(currentGroup)}&filename=${encodeURIComponent(file.name)}`;
      await fetch(url, { method: 'PUT', headers: {'Content-Type': file.type}, body: file });
    }
    btn.disabled = false;
    btn.textContent = 'Upload';
    refs.closeModal.click();
    loadGallery();
    showToast('Upload complete!');
  };

  function renderPreviewGrid() {
    refs.previewGrid.innerHTML = '';
    filesToUpload.forEach((file, i) => {
      const div = document.createElement('div');
      div.className = 'preview';
      const img = document.createElement('img');
      const reader = new FileReader();
      reader.onload = () => img.src = reader.result;
      reader.readAsDataURL(file);
      div.appendChild(img);

      // remove button
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.onclick = () => { filesToUpload.splice(i,1); renderPreviewGrid(); showToast('Removed from preview'); };
      div.appendChild(rm);

      // rotate button
      const rt = document.createElement('button');
      rt.textContent = '⟳';
      rt.className = 'rotate-btn';
      rt.onclick = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const tmp = new Image();
        tmp.onload = () => {
          canvas.width = tmp.height;
          canvas.height = tmp.width;
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(90*Math.PI/180);
          ctx.drawImage(tmp, -tmp.width/2, -tmp.height/2);
          canvas.toBlob(blob => {
            filesToUpload[i] = new File([blob], file.name, {type: file.type});
            renderPreviewGrid();
            showToast('Rotated preview');
          }, file.type);
        };
        tmp.src = reader.result;
      };
      div.appendChild(rt);

      refs.previewGrid.appendChild(div);
    });
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // 1) Groups + gallery
  loadGroups().then(loadGallery);
  // 2) Re‐run gallery whenever search / favorites change
  refs.searchInput.addEventListener('input', loadGallery);
  refs.filterFavorites.addEventListener('change', loadGallery);
  // 3) Upload UI
  initUploadUI();
});
