const API_BASE = 'https://jimi421-art.jimi421.workers.dev';

// Upload handler
document.getElementById('uploadBtn').addEventListener('click', async () => {
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';

  const files = document.getElementById('fileInput').files;
  const group = document.getElementById('groupInput').value.trim() || 'root';

  for (const file of files) {
    const uploadURL = `${API_BASE}/api/upload?group=${encodeURIComponent(group)}&filename=${encodeURIComponent(file.name)}`;
    await fetch(uploadURL, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file
    });
  }

  btn.textContent = 'Upload';
  btn.disabled = false;
  document.getElementById('fileInput').value = '';
  document.getElementById('groupInput').value = '';
  alert('Upload complete!');
});
