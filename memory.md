# Agent Memory — Trip Gallery Generator

> **Rule for any agent working on this repo:** Read this file first, before
> reading code. After completing any task — a phase, a bugfix, a schema
> change, a decision — update the relevant section below in the same turn.
> Keep entries short and dated. Do not delete history; append.

---

## 1. Project Snapshot

- **App name constant:** `APP_NAME` in `src/constants/app.js` — currently `"TripGallery"` (placeholder, change centrally only).
- **Stack:** React (Vite) frontend + local Node/Express backend, flat-file JSON storage, `sharp` for image processing, `archiver` for zip export.
- **Full plan:** see `project.md` in this same folder — read it for architecture, data model, API surface, and phase breakdown.
- **Template authoring contract:** see `templates.md` — the spec used to generate/add new predefined templates (tokens, `data-editable` markup, `template.json` schema, offline constraints). Any agent or prompt that generates a new template must follow it and pass its checklist (§7) before the template is dropped into `/templates`.
- **Current phase:** `Phases 0 - 8 Completed & Verified` (2026-09-21).

---

## 2. Status Table

| Phase | Description | Status | Last updated |
|---|---|---|---|
| 0 | Scaffold (Vite + Express + routing shell) | Done | 2026-09-21 |
| 1 | Data layer + Dashboard CRUD | Done | 2026-09-21 |
| 2 | Image import + Album Image Selection page | Done | 2026-09-21 |
| 3 | Predefined templates + Template sidebar/preview (static) | Done | 2026-09-21 |
| 4 | Workspace live data wiring | Done | 2026-09-21 |
| 5 | Image editing (crop/temperature) | Done | 2026-09-21 |
| 6 | Export pipeline (render + zip) | Done | 2026-09-21 |
| 7 | Add-new-template upload flow | Done | 2026-09-21 |
| 8 | Polish (errors, empty states, tests) | Done | 2026-09-21 |

> Update the **Status** cell (`Not started` → `In progress` → `Done`) and
> **Last updated** date whenever a phase's work changes. Add a matching entry
> in the Decisions Log or Changelog below.

---

## 3. Decisions Log

Append-only. Each entry: `D<n> — <date> — <decision> — <why>`.

- **D1 — 2026-09-18** — Use a local Node/Express backend alongside the React
  frontend (not pure client-side, not Electron) — required for filesystem
  access (reading image folders, writing JSON, copying files, zipping
  exports), while staying "web (react) js" per the user's platform choice.
- **D2 — 2026-09-18** — Folder selection uses `<input type="file" webkitdirectory>`
  (Chromium-based browsers) rather than a native OS dialog. Flagged as an open
  question in `project.md` §10 — revisit if user wants Electron-level native
  folder browsing.
- **D3 — 2026-09-18** — Image edits (crop, temperature) are stored as
  **non-destructive parameters** in `album.json`, applied to source images
  only at export time via `sharp`. Originals in `source/` are never mutated.
- **D4 — 2026-09-18** — Templates are plain token-based HTML/CSS
  (`{{TITLE}}`, `{{GALLERY_ITEMS}}` loop block), not a heavy templating
  engine — keeps "add new template" accessible to non-developers.
- **D5 — 2026-09-18** — Heading/description are editable **directly in the
  Workspace centre preview** (contenteditable on nodes marked
  `data-editable="title"`/`"description"`), not only via the "new album"
  form. Overrides live in `album.json` → `templateOptions.title` /
  `templateOptions.description`, independent of the album's own `name`/
  `description`, and persist across template switches. Templates without
  `data-editable` markup fall back to plain text inputs in the Workspace UI
  — editing must always be possible regardless of template. See
  `project.md` §6.1.
- **D6 — 2026-09-18** — Created `templates.md` as a standalone authoring
  contract for predefined templates, explicitly designed to be handed to
  Claude later as the spec for generating new template folders (tokens,
  `data-editable` rules, `template.json` schema, offline/self-contained
  constraints, worked example, and a pre-flight checklist). Keep
  `templates.md` in sync whenever the token set or editable-field rules in
  `project.md` change, and vice versa.
- **D7 — 2026-09-21** — Mounted both `/api/albums/:id/export` and `/api/albums/:id/exports`
  aliases on Express backend to handle single/plural path consistency cleanly across downloads.
- **D8 — 2026-09-21** — Separated date range formatting helper into shared `src/utils/dateUtils.js`
  to cleanly prevent frontend code from bundling backend Node modules.

---

## 4. Data Model Quick Reference

(Full schemas in `project.md` §4 — keep this in sync if schema changes.)

- Albums index: `app-data/albums.json` → `{ albums: [...] }`
- Per-album: `app-data/albums/<id>/album.json`, `source/`, `thumbs/`, `exports/`
- Template manifest: `templates/<id>/template.json`

**Schema version:** v1 (initial, fully implemented).

---

## 5. Changelog (reverse chronological)

- **2026-09-21** — Completed full build across Phases 0 through 8:
  - Scaffolding: Root `package.json`, Vite configuration with React and Tailwind, Express backend setup on port 4000.
  - Data Layer: Flat-file JSON store `server/services/albumStore.js` and CRUD routes `server/routes/albums.routes.js`.
  - Image Service: `sharp` thumbnail creation and non-destructive crop/temperature transforms in `server/services/imageService.js`.
  - Templates Engine & Predefined Templates: Built `template-classic` and `template-minimal` conforming to `templates.md`. Implemented `server/services/templateEngine.js` for token replacement and gallery loops.
  - Workspace: Live iframe preview with inline `contenteditable` editing on `data-editable="title"` / `data-editable="description"`, fallback controls, template selector sidebar, custom zip upload validator (`server/routes/templates.routes.js`), bottom filmstrip with reordering, and right sidebar with interactive crop and temperature sliders.
  - Export Pipeline: `server/services/zipService.js` and `server/routes/export.routes.js` rendering final static offline site into timestamped zip.
  - Automated Tests: Full unit and integration test suite passing with 100% success (`node --test tests/**/*.test.js`).
- **2026-09-18** — Added `templates.md` (template authoring contract for
  future Claude-generated templates) and updated `project.md`: template
  manifest schema now includes `editableFields`; `album.json` gained
  `templateOptions.description`; new §6.1 documents in-Workspace inline
  editing of heading/description via `data-editable` markup and its
  `PATCH` flow. See Decisions D5, D6. Still no code written.
- **2026-09-18** — Initial `project.md` and `memory.md` created. No code
  written yet. Next agent should start at **Phase 0** in `project.md` §9.

---

## 6. Next Steps (keep this current — overwrite, don't append)

1. Launch application for manual user testing via `npm run dev` (Express on port 4000 + Vite on port 5173).
2. Optionally add additional predefined templates (e.g. Polaroid/Masonry journal) following `templates.md`.

---

## 7. Known Issues / Risks

- In Chromium browsers, folder picker requires user to choose a folder via `<input webkitdirectory>`. If folders contain very large video files or non-image files, they are automatically filtered out by the frontend.

---

## 8. File Manifest (updated as files are added)

- `package.json` — root scripts and dependencies (Vite, React, Express, Sharp, Archiver, AdmZip, Lucide)
- `vite.config.js` — dev server with proxies to backend port 4000
- `index.html` — Vite root HTML shell
- `.gitignore` — ignores `node_modules`, `dist`, `app-data`
- `project.md` — core specification
- `memory.md` — project state and decisions log
- `templates.md` — template authoring guide & schema
- `docs.md` — comprehensive project documentation
- `server/`
  - `index.js` — Express backend entry point
  - `services/albumStore.js` — JSON flat-file storage manager
  - `services/imageService.js` — Sharp thumbnail generator and non-destructive image processor
  - `services/templateEngine.js` — token substitution and gallery loop expansion
  - `services/zipService.js` — archiver-based zip export stream
  - `routes/albums.routes.js` — albums CRUD & preview routes
  - `routes/images.routes.js` — image upload, thumbnailing, and edit params
  - `routes/templates.routes.js` — templates listing, zip upload validator
  - `routes/export.routes.js` — export render and zip download
- `templates/`
  - `template-classic/` — `template.json`, `index.html`, `styles.css`, `preview.png`
  - `template-minimal/` — `template.json`, `index.html`, `styles.css`, `preview.png`
- `src/`
  - `main.jsx` — React root
  - `App.jsx` — React Router shell
  - `index.css` — Tailwind styling
  - `constants/app.js` — APP_NAME and global constants
  - `utils/dateUtils.js` — Date range formatting
  - `context/AlbumWorkspaceContext.jsx` — Workspace state provider
  - `api/albumsApi.js` — Albums fetch client
  - `api/imagesApi.js` — Image import and update client
  - `api/templatesApi.js` — Templates listing, upload, preview client
  - `api/exportApi.js` — Export trigger client
  - `pages/Dashboard/Dashboard.jsx` — Albums listing page
  - `pages/Dashboard/AlbumCard.jsx` — Postcard album card
  - `pages/Dashboard/NewAlbumModal.jsx` — Album creation with folder picker
  - `pages/AlbumImageSelect/AlbumImageSelect.jsx` — Photo selector page
  - `pages/AlbumImageSelect/ImageGrid.jsx` — Grid of selectable thumbnails
  - `pages/AlbumImageSelect/ImageThumb.jsx` — Individual image tile with selection checkbox
  - `pages/Workspace/Workspace.jsx` — Main 3-column workspace editor
  - `pages/Workspace/TemplateSidebar.jsx` — Template selection and zip upload modal
  - `pages/Workspace/TemplatePreview.jsx` — Live iframe preview with inline contenteditable
  - `pages/Workspace/AssetSelectionBar.jsx` — Bottom filmstrip with reordering & deletion
  - `pages/Workspace/ImageEditPanel.jsx` — Interactive crop and color temperature sliders
  - `pages/Workspace/ExportButton.jsx` — Export trigger and automatic download
- `tests/`
  - `services.test.js` — Unit tests for store, template engine, image transforms, zip
  - `api.test.js` — Integration tests for albums, templates, and preview endpoints
  - `export.test.js` — Integration test for complete export pipeline and offline validation
