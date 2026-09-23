# TripGallery 📸🗺️

> **Turn your folders of trip photos into self-contained, shareable static HTML websites — 100% locally-run, zero cloud, zero database, zero external dependencies.**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68a063?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## ✨ Features

- 📂 **Local-First & Private:** Reads photos straight from your disk using browser directory selection (`<input webkitdirectory>`). No photos are ever uploaded to cloud servers.
- 📬 **Postcard Dashboard:** Browse your trips with cover images, date stamps, and photo counts.
- 🖼️ **Intuitive Photo Selection:** Multi-select, select all/none, set album cover, or import extra batches of photos at any time.
- 🎨 **Live Workspace with Inline Editing:**
  - **Live Iframe Preview:** See real-time updates as you switch templates or reorder photos.
  - **In-Canvas Text Editing:** Click directly on titles and subtitles inside the preview to edit text (`contenteditable`), saved automatically.
  - **Responsive Switcher:** Preview your gallery on Desktop, Tablet (768px), or Mobile (390px) viewports.
  - **Accent Color Picker:** Instantly customize accent highlights.
- ✂️ **Non-Destructive Image Editing:**
  - Interactive drag-to-crop rectangle and aspect ratio presets (1:1, 4:3, 16:9, Full Reset).
  - Color temperature slider (-50 Cool Blue to +50 Warm Amber) with live canvas preview.
  - Original source files remain completely untouched — transforms are saved as parameters and rendered via `sharp` only at export time.
- 🎞️ **Asset Filmstrip:** Reorder your photos sequence using left/right arrows or remove photos without leaving the editor.
- 📦 **One-Click Static Site Export (.zip):** Produces a fully self-contained website (`index.html` + `styles.css` + `assets/`) packaged as a `.zip` archive. Double-click `index.html` to view offline anywhere, or host on GitHub Pages, Netlify, Cloudflare Pages, or AWS S3.
- 🧩 **Extensible Templates:** Built-in **Classic Grid** (with lightbox modal) and **Minimal** templates, plus a zip upload tool to add your own custom templates.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** >= 18 (Tested on Node.js v24)
- **npm** >= 9

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/jidukrishna/tallery.git
cd tallery
npm install
```

### 3. Running in Development Mode
Launches both the Express backend API (port 4000) and the Vite frontend with hot-reloading (port 5173):
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🌐 Production & Custom Ports

### Run Unified Server on Default Port (4000)
Builds the production React bundle into `dist/` and serves the app and API from a single server:
```bash
npm run build
npm run start
```
Open **`http://localhost:4000`**.

### Run on a Custom Port (e.g., Port 8000)
Pass the `PORT` environment variable:
```bash
npm run build
PORT=8000 npm run start
```
Open **`http://localhost:8000`**.

---

## 🧪 Testing

TripGallery includes an automated test suite covering storage services, Sharp image transforms, template rendering, REST APIs, and export zip integrity:

```bash
npm test
```

---

## 📁 Project Architecture

```
tallery/
├── server/                      # Local Node/Express backend
│   ├── index.js                 # Server entry & static hosting
│   ├── routes/                  # API endpoints (/api/albums, /api/templates, etc.)
│   └── services/                # Flat-file store, Sharp processor, template engine, zip stream
├── src/                         # React 19 frontend
│   ├── pages/Dashboard/         # Postcard album list & new album modal
│   ├── pages/AlbumImageSelect/  # Photo selection grid & cover selection
│   ├── pages/Workspace/         # Live preview, inline editor, filmstrip, crop & temp panel
│   └── context/                 # Centralized workspace state provider
├── templates/                   # Zero-dependency predefined site templates
│   ├── template-classic/        # Clean centered hero with responsive grid & lightbox
│   └── template-minimal/        # Full-bleed grid with single-line header
├── app-data/                    # Local flat-file storage (JSON + source/thumbs/exports)
└── tests/                       # Unit & integration tests (node:test)
```

---

## 📖 Documentation

For in-depth specifications, refer to the documentation files:
- 📘 [`docs.md`](docs.md) — Comprehensive technical documentation, storage schemas, and REST API reference.
- 📐 [`project.md`](project.md) — Product requirements, technical decisions, and architecture spec.
- 🎨 [`templates.md`](templates.md) — Template authoring guide, token substitution reference, and offline checklist.
- 🧠 [`memory.md`](memory.md) — Development changelog and agent decisions log.

---

## 📄 License

MIT License. Free to use, modify, and distribute.

