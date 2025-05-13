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
  const filenameDisplay = document.getElementById('filenameDisplay');
  const isVideo = filename.match(/\.(mp4|mov|webm)$/i);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.src = `${API_BASE}/api/image?group=${group}&filename=${encodeURIComponent(filename)}`;
  if (isVideo) media.controls = true;
  media.alt = filename;
  media.className = 'main-media';
  container.appendChild(media);

  // Update link metadata
  filenameDisplay.textContent = filename;
  document.getElementById('groupName').textContent = group;
  document.getElementById('groupLink').href = `/gallery.html?group=${encodeURIComponent(group)}`;
  document.getElementById('groupLink').textContent = group;

  const shareLink = `${window.location.origin}/photo.html?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`;
  document.getElementById('shareLink').value = shareLink;

  // Load metadata from KV
  try {
    const metaRes = await fetch(`${API_BASE}/api/metadata?group=${group}&filename=${filename}`);
    if (metaRes.ok) {
      const meta = await metaRes.json();

      document.getElementById('metaTitle').value = meta.title || '';
      document.getElementById('favoriteChk').checked = meta.favorite || false;

      if (Array.isArray(meta.tags)) {
        meta.tags.forEach(addTagToDisplay);
      }
    }
  } catch (err) {
    console.error('Failed to load metadata:', err);
  }
}

function addTagToDisplay(tag) {
  const span = document.createElement('span');
  span.textContent = tag;
  span.className = 'tag';
  span.onclick = () => span.remove(); // remove on click
  document.getElementById('tagsDisplay').appendChild(span);
}

document.getElementById('addTagBtn').onclick = () => {
  const input = document.getElementById('tagInput');
  const tag = input.value.trim();
  if (tag) {
    addTagToDisplay(tag);
    input.value = '';
  }
};

document.getElementById('saveMetaBtn').onclick = async () => {
  const { group, filename } = getQueryParams();

  const tags = Array.from(document.querySelectorAll('#tagsDisplay .tag'))
                    .map(el => el.textContent);

  const metaPayload = {
    title: document.getElementById('metaTitle').value,
    tags,
    favorite: document.getElementById('favoriteChk').checked
  };

  try {
    const res = await fetch(`${API_BASE}/api/metadata?group=${group}&filename=${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metaPayload)
    });

    if (res.ok) {
      alert('✅ Metadata saved!');
    } else {
      alert('❌ Save failed. Check console for details.');
      console.error(await res.text());
    }
  } catch (err) {
    alert('❌ Save failed: ' + err.message);
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
