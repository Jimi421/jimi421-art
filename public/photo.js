const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

function getParams() {
  const url = new URL(window.location.href);
  return {
    group: url.searchParams.get('group') || 'root',
    filename: url.searchParams.get('filename')
  };
}

function loadMedia() {
  const { group, filename } = getParams();
  if (!filename) return;

  const container = document.getElementById('mediaContainer');
  const filenameDisplay = document.getElementById('filenameDisplay');
  const isVideo = filename.match(/\.(mp4|mov|webm)$/i);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.src = `${API_BASE}/api/image?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`;
  if (isVideo) media.controls = true;
  media.alt = filename;
  media.style.maxWidth = '100%';
  container.appendChild(media);
  filenameDisplay.textContent = filename;

  const shareLink = `${window.location.origin}/photo.html?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`;
  document.getElementById('shareLink').value = shareLink;
}

function openShare() {
  document.getElementById('shareModal').classList.add('active');
}

function copyShareLink() {
  const input = document.getElementById('shareLink');
  input.select();
  document.execCommand('copy');
  alert('Link copied to clipboard!');
  document.getElementById('shareModal').classList.remove('active');
}

window.addEventListener('DOMContentLoaded', loadMedia);
