const API_BASE = 'https://jimi421-art.jimi421.workers.dev';
let filesToUpload = [], currentGroup = 'root';

// Removed loadGroups()

async function loadGallery(group = 'root') {
  const res = await fetch(`${API_BASE}/api/gallery?group=${encodeURIComponent(group)}`);
  const items = await res.json();
  const container = document.getElementById('gallery');
  container.innerHTML = '';

  items.reverse().forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    const isVideo = item.key.match(/\.(mp4|mov|webm)$/i);
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = `${API_BASE}${item.url}`;
    if (media.tagName === 'VIDEO') media.controls = true;
    media.className = 'media';
    card.appendChild(media);
    card.onclick = () => {
      window.location.href = `/photo.html?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(item.key)}`;
    };
    container.appendChild(card);
  });
}

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
    const url = `${API_BASE}/api/upload?group=${encodeURIComponent(currentGroup)}&filename=${encodeURIComponent(file.name)}`;
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
  }
  btn.disabled = false;
  btn.textContent = 'Upload';
  document.getElementById('closeModal').click();
  loadGallery(currentGroup);
  showToast('Upload complete!');
};

function renderPreviewGrid() {
  const previewGrid = document.getElementById('previewGrid');
  previewGrid.innerHTML = '';
  filesToUpload.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = () => {
      const div = document.createElement('div');
      div.className = 'preview';
      const img = document.createElement('img');
      img.src = reader.result;
      div.appendChild(img);

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '✕';
      removeBtn.onclick = () => {
        filesToUpload.splice(index, 1);
        renderPreviewGrid();
        showToast('Removed from preview');
      };
      div.appendChild(removeBtn);

      const rotateBtn = document.createElement('button');
      rotateBtn.textContent = '⟳';
      rotateBtn.className = 'rotate-btn';
      rotateBtn.onclick = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const image = new Image();
        image.onload = () => {
          canvas.width = image.height;
          canvas.height = image.width;
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate(90 * Math.PI / 180);
          ctx.drawImage(image, -image.width / 2, -image.height / 2);
          canvas.toBlob(blob => {
            filesToUpload[index] = new File([blob], file.name, { type: file.type });
            renderPreviewGrid();
            showToast('Rotated preview');
          }, file.type);
        };
        image.src = reader.result;
      };
      div.appendChild(rotateBtn);

      previewGrid.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('DOMContentLoaded', () => {
  loadGallery(); // No loadGroups
});

