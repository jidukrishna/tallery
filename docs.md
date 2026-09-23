# Trip Gallery Generator — Comprehensive Project Documentation

A **locally-run web application** that transforms a local folder of trip photos into a self-contained, standalone static HTML "trip gallery" website.

---

## 1. Product Summary & Philosophy

- **Platform:** Web (React + Node.js Express local server).
- **Zero Cloud / Zero Auth / Zero Database:** All data is kept strictly on the user's local disk in a human-inspectable flat-file JSON structure (`app-data/`).
- **Core User Flow:**
  $$\text{Dashboard} \longrightarrow \text{Album Image Selection} \longrightarrow \text{Workspace (Template + Live Edit)} \longrightarrow \text{Export (.zip)}$$
- **Deliverable / Output:** A self-contained static website (`index.html` + `styles.css` + `assets/`) that works offline by simply opening `index.html` in any web browser without needing any web server or external network connection.

---

## 2. Tech Stack & Architecture

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 19 + Vite 6 | Lightning-fast development server, instant hot module replacement, and lightweight static build. |
| **Styling** | Tailwind CSS v4 | Clean utility classes for modern UI, postcard tiles, and responsive layouts. |
| **Routing** | React Router v7 | Seamless client-side routing between Dashboard, Photo Selector, and Workspace. |
| **Backend Server** | Node.js + Express 4 (Local only) | Provides secure local filesystem access (folder reading, copying files, generating thumbnails, writing JSON, streaming zip files). |
| **Image Processing** | `sharp` (Backend) | Fast, native image operations: auto-rotation based on EXIF, thumbnail generation, non-destructive cropping, and RGB color temperature adjustments. |
| **Zip Packaging** | `archiver` & `adm-zip` | Streams static site files into `.zip` archives with high compression; unzips and validates custom template uploads. |
| **Local Storage** | Flat Files (JSON + Directories) | Human-readable and editable without requiring SQLite or database engines. |
| **Folder Selection** | `<input type="file" webkitdirectory>` | Native browser folder picker (Chromium-supported) keeping the app purely web-based without Electron bloat. |

---

## 3. Project Directory Structure

```
tallery/
├── package.json                 # Project scripts (dev, build, start, test) and dependencies
├── vite.config.js               # Vite config with backend proxies (/api, /app-data, /templates)
├── index.html                   # Vite HTML entry point
├── project.md                   # Core product requirements & architecture plan
├── memory.md                    # Agent memory, decision log, and status tracking
├── templates.md                 # Standalone authoring contract for templates
├── docs.md                      # Complete project documentation (this file)
│
├── server/                      # Local Express backend
│   ├── index.js                 # Server bootstrapper, static file hosting, and route mounting
│   ├── routes/
│   │   ├── albums.routes.js     # CRUD endpoints for albums and iframe preview renderer
│   │   ├── images.routes.js     # Multipart image folder import, listing, and edit params
│   │   ├── templates.routes.js  # Template discovery and custom template zip upload validator
│   │   └── export.routes.js     # Full site render, sharp processing, and zip download
│   └── services/
│       ├── albumStore.js        # Flat-file JSON read/write persistence
│       ├── imageService.js      # Sharp-based thumbnailing and export transformations
│       ├── templateEngine.js    # Token substitution and gallery loop expansion
│       └── zipService.js        # Archiver streaming zip utility
│
├── templates/                   # Predefined site templates
│   ├── template-classic/        # Clean centered hero with accent bar, responsive grid, lightbox
│   │   ├── template.json        # Template manifest
│   │   ├── index.html           # Tokenized HTML with data-editable attributes
│   │   ├── styles.css           # Pure, self-contained CSS
│   │   └── preview.png          # Sidebar preview thumbnail
│   └── template-minimal/        # Full-bleed grid with single-line header
│       ├── template.json
│       ├── index.html
│       ├── styles.css
│       └── preview.png
│
├── src/                         # React frontend source
│   ├── main.jsx                 # React root mount
│   ├── App.jsx                  # Top navigation shell and React Router setup
│   ├── index.css                # Tailwind CSS imports & base styles
│   ├── constants/
│   │   └── app.js               # Global constants (APP_NAME, DEFAULT_TEMPLATE_ID, etc.)
│   ├── utils/
│   │   └── dateUtils.js         # Shared date range formatting helper
│   ├── api/                     # Fetch API client abstraction
│   │   ├── albumsApi.js         # Album endpoints
│   │   ├── imagesApi.js         # Image import and edit endpoints
│   │   ├── templatesApi.js      # Template listing and preview endpoints
│   │   └── exportApi.js         # Export trigger endpoint
│   ├── context/
│   │   └── AlbumWorkspaceContext.jsx # Workspace global state (album, edits, selection)
│   └── pages/
│       ├── Dashboard/           # Page 1: Postcard album tiles & creation modal
│       │   ├── Dashboard.jsx
│       │   ├── AlbumCard.jsx
│       │   └── NewAlbumModal.jsx
│       ├── AlbumImageSelect/    # Page 2: Photo selection grid & cover selection
│       │   ├── AlbumImageSelect.jsx
│       │   ├── ImageGrid.jsx
│       │   └── ImageThumb.jsx
│       └── Workspace/           # Page 3: 3-column template editor & export
│           ├── Workspace.jsx
│           ├── TemplateSidebar.jsx
│           ├── TemplatePreview.jsx
│           ├── AssetSelectionBar.jsx
│           ├── ImageEditPanel.jsx
│           └── ExportButton.jsx
│
├── app-data/                    # Runtime-created local storage (gitignored)
│   ├── albums.json              # Global index of all albums
│   └── albums/<albumId>/        # Individual album data, source images, thumbs, exports
│
├── tests/                       # Automated test suite (node:test)
│   ├── services.test.js         # Unit tests for albumStore, templateEngine, imageService, zipService
│   ├── api.test.js              # Integration tests for albums, templates, and preview
│   └── export.test.js           # End-to-end export pipeline and offline zip integrity test
└── dist/                        # Production build output
```

---

## 4. Data Model & Storage Specifications

### 4.1 Global Albums Index — `app-data/albums.json`
Maintains the list of all created trip albums for quick dashboard rendering:
```json
{
  "albums": [
    {
      "id": "alb_V1StGXR8",
      "name": "Summer in Tokyo",
      "description": "Temples, tea houses, and Shibuya crossing",
      "fromDate": "2026-06-10",
      "toDate": "2026-06-20",
      "coverImage": "/app-data/albums/alb_V1StGXR8/thumbs/photo_1.jpg",
      "createdAt": "2026-06-21T10:00:00.000Z",
      "updatedAt": "2026-06-21T10:30:00.000Z",
      "imageCount": 48
    }
  ]
}
```

### 4.2 Per-Album Directory — `app-data/albums/<albumId>/`
Every album has its own isolated directory on disk:
- `album.json`: Full configuration, image list, ordering, non-destructive edits, and template preferences.
- `source/`: Untouched, original image files uploaded from the user's selected folder.
- `thumbs/`: Fast, lightweight thumbnails (~400px) generated by `sharp` for smooth UI rendering.
- `exports/`: Generated standalone `.zip` packages timestamped upon export.

### 4.3 `album.json` Schema
```json
{
  "id": "alb_V1StGXR8",
  "name": "Summer in Tokyo",
  "description": "Temples, tea houses, and Shibuya crossing",
  "fromDate": "2026-06-10",
  "toDate": "2026-06-20",
  "coverImage": "/app-data/albums/alb_V1StGXR8/thumbs/photo_1.jpg",
  "images": [
    {
      "id": "img_a1b2c3d4",
      "file": "tokyo_shibuya.jpg",
      "originalName": "DSC_0124.JPG",
      "selected": true,
      "order": 0,
      "edits": {
        "crop": { "x": 0.05, "y": 0.1, "w": 0.9, "h": 0.8 },
        "temperature": 15
      }
    }
  ],
  "templateId": "template-classic",
  "templateOptions": {
    "title": "Tokyo 2026",
    "description": "A week exploring Shinjuku and Asakusa",
    "accentColor": "#2b6cb0"
  },
  "createdAt": "2026-06-21T10:00:00.000Z",
  "updatedAt": "2026-06-21T10:30:00.000Z",
  "lastExportedAt": null
}
```

> **Note on Template Overrides:** `templateOptions.title` and `templateOptions.description` act as independent overrides for the text shown on the generated static website. Editing them in the Workspace preview does not mutate the album's dashboard metadata.

---

## 5. Backend REST API Reference

All backend routes are prefixed with `/api/` and hosted locally:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning status and current server time. |
| `GET` | `/api/albums` | Returns list of all album summaries from `albums.json`. |
| `POST` | `/api/albums` | Creates a new album folder and initial `album.json`. |
| `GET` | `/api/albums/:id` | Returns full album details and images list. |
| `PATCH` | `/api/albums/:id` | Updates album metadata, template options, or image selections. |
| `DELETE` | `/api/albums/:id` | Recursively deletes the album folder and removes it from `albums.json`. |
| `POST` | `/api/albums/:id/preview` | Compiles and returns live rendered HTML for iframe preview. |
| `POST` | `/api/albums/:id/images/import` | Multipart upload (`multer`) accepting picked folder files; saves originals and generates thumbnails. |
| `GET` | `/api/albums/:id/images` | Lists images in the album with thumbnail and source URLs. |
| `PATCH` | `/api/albums/:id/images/:imageId` | Updates per-image non-destructive edit parameters (crop, temperature). |
| `GET` | `/api/templates` | Lists all available templates with parsed manifests. |
| `POST` | `/api/templates` | Uploads and validates a custom template `.zip` file. |
| `POST` | `/api/albums/:id/export` | Processes images with `sharp`, renders final template, creates zip, returns download URL. |
| `GET` | `/api/albums/:id/export/:filename` | Downloads the generated `.zip` package. |

---

## 6. Template Authoring Contract

Templates are pure HTML/CSS layouts that require **no build step** and **no external CDN dependencies**.

### 6.1 Required Template Folder Structure
```
templates/template-<name>/
├── template.json      # Manifest (required)
├── index.html         # Tokenized HTML (required)
├── styles.css         # All styling (required)
└── preview.png        # Thumbnail shown in the Workspace sidebar (required)
```

### 6.2 `template.json` Manifest
```json
{
  "id": "template-classic",
  "name": "Classic Grid",
  "description": "Clean centered hero with responsive photo grid.",
  "thumbnail": "preview.png",
  "regions": ["hero", "gallery-grid", "footer"],
  "supportsFields": ["title", "description", "dateRange", "accentColor"],
  "editableFields": ["title", "description"]
}
```

### 6.3 Substitution Tokens
- `{{TITLE}}`: Replaced with `templateOptions.title` (falls back to album name).
- `{{DESCRIPTION}}`: Replaced with `templateOptions.description` (falls back to album description).
- `{{DATE_RANGE}}`: Preformatted date range (e.g. `Jun 10 – Jun 20, 2026`).
- `{{ACCENT_COLOR}}`: Hex color (e.g. `#2b6cb0`).

### 6.4 Gallery Loop Block
Images are repeated using HTML comment delimiters:
```html
<div class="gallery-grid">
  <!--GALLERY_ITEM_START-->
  <figure class="gallery-item">
    <img src="assets/{{IMAGE_FILE}}" alt="{{IMAGE_ALT}}" loading="lazy" />
  </figure>
  <!--GALLERY_ITEM_END-->
</div>
```
Per-image tokens inside the block:
- `{{IMAGE_FILE}}`: The processed image filename (e.g. `photo_1.jpg`).
- `{{IMAGE_ALT}}`: Automated descriptive alt text (e.g. `Summer in Tokyo photo 1`).
- `{{IMAGE_INDEX}}`: 1-based sequential number (`1`, `2`, `3`...).

### 6.5 Inline-Editable Elements (`data-editable`)
Any element that renders `{{TITLE}}` or `{{DESCRIPTION}}` should be wrapped with `data-editable="title"` or `data-editable="description"`. The Workspace automatically turns these into live `contenteditable="true"` regions inside the iframe, persisting edits immediately on blur.

### 6.6 Offline Guarantee
Exported sites must function when opened via `file:///path/to/index.html` with no network:
- **No external fonts:** Use system font stacks (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **No CDN scripts:** Scripts must be vanilla JS inlined in `index.html`.
- **No absolute URLs:** All image references must use relative paths `assets/<filename>`.

---

## 7. Key Features & User Experience

### 7.1 Dashboard (`/`)
- Postcard-style album tiles showing cover photo, title, date range badge, and photo count.
- Modal to create albums with folder selection (`<input webkitdirectory>`).
- Image filtering: Automatically filters out non-image files upon folder pick.
- Direct navigation into the album upon creation.

### 7.2 Album Image Select (`/album/:id`)
- Grid of imported photos with thumbnail previews.
- Toggle selection per image or use "Select All" / "Deselect All".
- Set any photo as the album's cover image.
- "Add Photos" button to import additional photos into an existing album.

### 7.3 Workspace (`/workspace/:id`)
- **Left Sidebar:** Instant visual switching between available templates. "+ Add" button to upload custom template `.zip` archives with automated validation.
- **Center Canvas:** Live rendered iframe preview of the gallery.
  - Inline editing of heading and description directly inside the preview.
  - Responsive preview switcher: Desktop, Tablet (768px), and Mobile (390px).
  - Accent color picker that dynamically alters template accent variables.
  - Collapsible "Page Details" bar as a fallback editor.
- **Bottom Filmstrip:** Ordered sequence of selected photos.
  - Move Left / Move Right reordering controls.
  - Quick removal of photos from the gallery without leaving the workspace.
  - Click any photo to focus it in the right edit panel.
- **Right Edit Panel:**
  - Non-destructive crop tool with interactive draggable bounding box.
  - One-click crop aspect ratio presets: Full (Reset), 1:1 Square, 4:3 Standard, 16:9 Wide.
  - Color temperature slider (-50 Cool Blue to +50 Warm Amber) with instant canvas filter preview.
  - "Reset Edits" button.
- **Export Button:** Triggers `sharp` rendering of all selected images, injects final HTML, packages the directory with `archiver`, and initiates automatic browser download of the `.zip`.

---

## 8. Getting Started & Running the Project

### Prerequisites
- Node.js >= 18 (Tested on Node.js v24.15.0)
- npm >= 9

### Installation
```bash
cd tallery
npm install
```

### Running in Development Mode
Starts both the Express backend (port 4000) and the Vite development server (port 5173) with live hot reloading:
```bash
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### Running in Unified Production Mode
Builds the React client into `dist/` and runs a single Express server serving both the frontend and API:
```bash
npm run build
npm run start
```
By default, the server runs on port 4000. Open **`http://localhost:4000`**.

### Running on a Custom Port (e.g., Port 8000)
Pass the `PORT` environment variable:
```bash
npm run build
PORT=8000 npm run start
```
Open **`http://localhost:8000`** in your browser.

### Running Automated Tests
Run the built-in `node:test` test suite covering services, REST APIs, and export integrity:
```bash
npm test
```

---

## 9. Global Constants

Configured in `src/constants/app.js`:

```javascript
export const APP_NAME = "TripGallery"; // App branding string
export const APP_DATA_DIR = "app-data"; // Backend storage root
export const ALBUMS_INDEX_FILE = "albums.json"; // Global index filename
export const DEFAULT_TEMPLATE_ID = "template-classic"; // Fallback template
```

All UI strings and titles import `APP_NAME` centrally.

---

## 10. Frequently Asked Questions (FAQ)

**Q: Are my original photos ever modified or overwritten?**  
A: No. Original imported photos are copied to `app-data/albums/<id>/source/` and remain strictly untouched. All crop and temperature edits are saved as parameters in `album.json` and rendered only into the exported zip's `assets/` folder.

**Q: Can the exported gallery website be hosted anywhere?**  
A: Yes! Unzip the generated archive and upload the files to GitHub Pages, Netlify, Cloudflare Pages, S3, or any static host. You can also view it locally by double-clicking `index.html`.

**Q: How do I create a new template?**  
A: Follow the specifications in `templates.md`. Create a new directory under `templates/template-<name>/` with `template.json`, `index.html`, `styles.css`, and `preview.png`. It will automatically appear in the Workspace sidebar upon restart or refresh.

