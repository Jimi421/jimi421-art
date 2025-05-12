# 🎨 Jimi421 Art Gallery

A minimalist, mobile-friendly web app for uploading, managing, and sharing your own artwork and photos. Built using Cloudflare’s free developer platform.

---

## 🌐 Live Demo

👉 [https://jimi421-art.pages.dev](https://jimi421-art.pages.dev)

---

## ✨ Features

- 📷 Upload multiple photos from desktop or phone
- 🖼 Thumbnail preview with rotate + remove
- 🔍 Fullscreen viewer with share + rename
- 📋 Social sharing (SMS, email, Twitter, WhatsApp, etc.)
- 🧽 Clean, responsive interface
- 🔒 Private storage via Cloudflare R2 + KV

---

## 🚀 Getting Started

1. **Clone the repo:**

```bash
git clone https://github.com/jimi421/jimi421-art.git
cd jimi421-art
Install Wrangler:

bash
Copy
Edit
npm install -g wrangler
Create your Wrangler config:

bash
Copy
Edit
cp wrangler.example.toml wrangler.toml
Edit with your Cloudflare credentials.

Deploy your Worker:

bash
Copy
Edit
wrangler deploy
Deploy frontend:

Use Cloudflare Pages and point it to your public/ folder.

🗂 Folder Structure
cpp
Copy
Edit
📁 jimi421-art/
├── public/
├── worker/
├── wrangler.toml
├── wrangler.example.toml
└── README.md
✅ License
MIT – use, remix, share.

🙌 Credits
Built with 💙 by @jimi421
Powered by Cloudflare Developer Platform