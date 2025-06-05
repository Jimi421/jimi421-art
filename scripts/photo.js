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

  const container = document.getElementById('mediaContainer');
  const isVideo = filename.match(/\.(mp4|mov|webm)$/i);
  const media = document.createElement(isVideo ? 'video' : 'img');
  media.src = `${API_BASE}/api/image?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`;
  if (isVideo) media.controls = true;
  media.alt = filename;
  media.className = 'main-media';
  container.appendChild(media);

  // Display “Uncategorized” instead of “root”
  const displayGroup = group === 'root' ? 'Uncategorized' : group;
  document.getElementById('groupName').textContent = displayGroup;
  document.getElementById('groupLink').href = `/gallery.html?group=${encodeURIComponent(group)}`;
  document.getElementById('groupLink').textContent = displayGroup;

  // Set share link (still passes ‘root’ in URL if ungrouped)
  document.getElementById('shareLink').value =
    `${window.location.origin}/photo.html?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`;

  const titleText = document.getElementById('titleText');
  const titleInput = document.getElementById('titleInput');
  const favoriteChk = document.getElementById('favoriteChk');
  const tagsDisplay = document.getElementById('tagsDisplay');

  // Load metadata (title, tags, favorite)
  try {
    const res = await fetch(
      `${API_BASE}/api/metadata?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`
    );
    if (res.ok) {
      const meta = await res.json();
      // Title fallback → filename
      const title = meta.title || filename;
      titleText.textContent = title;
      titleInput.value = title;

      // Favorite checkbox
      favoriteChk.checked = meta.favorite || false;

      // Tags fallback → empty array
      if (Array.isArray(meta.tags)) {
        meta.tags.forEach(addTagToDisplay);
      }
    } else {
      // If metadata call fails, just show filename
      titleText.textContent = filename;
      titleInput.value = filename;
    }
  } catch (err) {
    console.warn('Metadata fetch failed:', err);
    titleText.textContent = filename;
    titleInput.value = filename;
  }
}

// When user clicks on the title text, swap to input for editing
document.getElementById('editableTitle').onclick = () => {
  const text = document.getElementById('titleText');
  const input = document.getElementById('titleInput');
  text.style.display = 'none';
  input.style.display = 'inline-block';
  input.focus();
};

// When title input loses focus, write it back to the text and hide input
document.getElementById('titleInput').onblur = () => {
  const text = document.getElementById('titleText');
  const input = document.getElementById('titleInput');
  text.textContent = input.value;
  text.style.display = 'inline';
  input.style.display = 'none';
};

// “Add Tag” button → create a <span class="tag"> and append
document.getElementById('addTagBtn').onclick = () => {
  const input = document.getElementById('tagInput');
  const tag = input.value.trim();
  if (tag) {
    addTagToDisplay(tag);
    input.value = '';
  }
};

// Helper to render a single tag bubble
function addTagToDisplay(tag) {
  const span = document.createElement('span');
  span.textContent = tag;
  span.className = 'tag';
  // Clicking a tag removes it
  span.onclick = () => span.remove();
  document.getElementById('tagsDisplay').appendChild(span);
}

// “Save Metadata” → collect title, tags, favorite → PUT to KV
document.getElementById('saveMetaBtn').onclick = async () => {
  const { group, filename } = getQueryParams();
  // Gather tags from all <span class="tag">
  const tags = Array.from(document.querySelectorAll('#tagsDisplay .tag')).map(el => el.textContent);
  const title = document.getElementById('titleInput').value;
  const favorite = document.getElementById('favoriteChk').checked;

  const payload = { title, tags, favorite };

  try {
    const res = await fetch(
      `${API_BASE}/api/metadata?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(filename)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );
    if (res.ok) {
      alert('✅ Metadata saved!');
    } else {
      alert('❌ Failed to save metadata.');
    }
  } catch (err) {
    alert('❌ Error saving metadata: ' + err.message);
  }
};

// Show/hide the share‐link input
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
