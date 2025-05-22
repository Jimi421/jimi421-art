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

  const container = document.getElementById('mediaContainer');
  const isVideo = filename.match(/\.(mp4|mov|webm)$/i);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.src = `${API_BASE}/api/image?group=${group}&filename=${encodeURIComponent(filename)}`;
  if (isVideo) media.controls = true;
  media.alt = filename;
  media.className = 'main-media';
  container.appendChild(media);

  document.getElementById('groupName').textContent = group;
  document.getElementById('groupLink').href = `/gallery.html?group=${encodeURIComponent(group)}`;
  document.getElementById('groupLink').textContent = group;
  document.getElementById('shareLink').value =
    `${window.location.origin}/photo.html?group=${group}&filename=${encodeURIComponent(filename)}`;

  const titleText = document.getElementById('titleText');
  const titleInput = document.getElementById('titleInput');

  try {
    const res = await fetch(`${API_BASE}/api/metadata?group=${group}&filename=${filename}`);
    if (res.ok) {
      const meta = await res.json();
      const title = meta.title || filename;
      titleText.textContent = title;
      titleInput.value = title;

      document.getElementById('favoriteChk').checked = meta.favorite || false;
      if (Array.isArray(meta.tags)) {
        meta.tags.forEach(addTagToDisplay);
      }
    } else {
      titleText.textContent = filename;
      titleInput.value = filename;
    }
  } catch {
    titleText.textContent = filename;
    titleInput.value = filename;
  }
}

document.getElementById('editableTitle').onclick = () => {
  const text = document.getElementById('titleText');
  const input = document.getElementById('titleInput');
  text.style.display = 'none';
  input.style.display = 'inline-block';
  input.focus();
};

document.getElementById('titleInput').onblur = () => {
  const text = document.getElementById('titleText');
  const input = document.getElementById('titleInput');
  text.textContent = input.value;
  text.style.display = 'inline';
  input.style.display = 'none';
};

document.getElementById('addTagBtn').onclick = () => {
  const input = document.getElementById('tagInput');
  const tag = input.value.trim();
  if (tag) {
    addTagToDisplay(tag);
    input.value = '';
  }
};

function addTagToDisplay(tag) {
  const span = document.createElement('span');
  span.textContent = tag;
  span.className = 'tag';
  span.onclick = () => span.remove();
  document.getElementById('tagsDisplay').appendChild(span);
}

document.getElementById('saveMetaBtn').onclick = async () => {
  const { group, filename } = getQueryParams();
  const tags = Array.from(document.querySelectorAll('#tagsDisplay .tag')).map(el => el.textContent);
  const title = document.getElementById('titleInput').value;
  const favorite = document.getElementById('favoriteChk').checked;

  const payload = { title, tags, favorite };

  try {
    const res = await fetch(`${API_BASE}/api/metadata?group=${group}&filename=${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      alert('✅ Metadata saved!');
    } else {
      alert('❌ Failed to save metadata.');
    }
  } catch (err) {
    alert('❌ Error saving metadata: ' + err.message);
  }
};

function openShare() {
  document.getElementById('shareLink').style.display = 'block';
}

function copyShareLink() {
  const input = document.getElementById('shareLink');
  input.select();
  document.execCommand('copy');
  alert('Link copied to clipboard!');
}

window.addEventListener('DOMContentLoaded', loadPhoto);