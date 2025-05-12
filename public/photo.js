// public/photo.js

const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    group: params.get('group') || 'root',
    filename: params.get('filename')
  };
}

async function loadPhoto() {
  const { group, filename } = getQueryParams();
  if (!filename) return;

  // Load metadata
  const resMeta = await fetch(`${API_BASE}/api/photo-meta?group=${group}&filename=${encodeURIComponent(filename)}`);
  const meta = await resMeta.json();

  const container = document.getElementById('photoContainer');
  container.innerHTML = '';

  const isVideo = filename.match(/\.(mp4|mov|webm)$/i);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.src = `${API_BASE}/api/image?group=${group}&filename=${encodeURIComponent(filename)}`;
  if (isVideo) media.controls = true;
  media.className = 'main-media';

  const title = document.createElement('h2');
  title.textContent = meta.title || filename;

  const tags = document.createElement('p');
  tags.textContent = `Tags: ${(meta.tags || []).join(', ')}`;

  const desc = document.createElement('p');
  desc.textContent = meta.description || 'No description';

  const date = document.createElement('p');
  date.textContent = `Uploaded: ${meta.uploaded || 'Unknown date'}`;

  container.appendChild(media);
  container.appendChild(title);
  container.appendChild(tags);
  container.appendChild(desc);
  container.appendChild(date);
}

window.addEventListener('DOMContentLoaded', loadPhoto);
