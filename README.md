<<<<<<< HEAD
=======
📄 README.md
markdown
Copy
Edit
>>>>>>> fed0070 (Add clean README.md to project root)
# 🎨 Jimi421 Art Gallery

A modern, mobile-friendly web app for uploading, previewing, and sharing personal artwork or photos. Built on Cloudflare’s free stack using:

- ⚡ Cloudflare Workers
- ☁️ Cloudflare R2 (for image storage)
- 📄 Cloudflare Pages (for the frontend)

---

## 🌟 Features

- Drag-and-drop or tap-to-upload interface
- Thumbnail previews before upload (with rotate & remove)
- Fullscreen image view on click
- Share links via clipboard, SMS, or social
- Simple inline file renaming
- Lightweight, clean design for desktop + mobile

---

## 🗂 Folder Structure

📦 jimi421-art
├── public/ # Frontend assets
│ ├── index.html # Main page
│ └── gallery.html # (Optional) sub-gallery
├── worker/
│ └── index.js # Cloudflare Worker backend
├── wrangler.toml # Local Worker config (not tracked)
├── wrangler.example.toml # Template config (safe for repo)

yaml
Copy
Edit

---

## 🚀 Getting Started

1. **Install Wrangler**
```bash
npm install -g wrangler
Create your config

bash
Copy
Edit
cp wrangler.example.toml wrangler.toml
Edit wrangler.toml with your Cloudflare account info

Deploy

bash
Copy
Edit
wrangler deploy
Visit your deployed Worker

arduino
Copy
Edit
https://jimi421-art.jimi421.workers.dev
🛑 Notes
Make sure wrangler.toml is in .gitignore to avoid leaking personal credentials.

wrangler.example.toml is provided for safe sharing.

✅ License
MIT – use, remix, and deploy freely.

🙌 Credits
<<<<<<< HEAD
<<<<<<< HEAD
Built with 💙 by @jimi421 and powered by Cloudflare.
=======
Built with 💙 by @jimi421 and powered by Cloudflare.
>>>>>>> fed0070 (Add clean README.md to project root)
=======
Built with 💙 by @jimi421 and powered by Cloudflare.
### 🌐 Live Demo

Check it out here:  
**[https://jimi421-art.pages.dev](https://jimi421-art.pages.dev)**

<<<<<<< HEAD
>>>>>>> 0b59405 (Add live site link to README)
=======

### 🌐 Live Demo

Check it out here:  
**[https://jimi421-art.pages.dev](https://jimi421-art.pages.dev)**

>>>>>>> d7798cf (Add live site link to README)
