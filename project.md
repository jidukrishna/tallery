# Trip Gallery Generator — Implementation Plan

> **Companion file:** `memory.md` (same folder). Every agent session that makes a
> structural/architectural change, finishes a milestone, or makes a non-obvious
> decision MUST update `memory.md` before ending. `project.md` describes the
> *plan* (stable); `memory.md` describes *current state* (changes constantly).

---

## 1. Product Summary

A **locally-run** web app that turns a folder of trip photos into a static,
shareable HTML "trip gallery" website.

Flow: **Dashboard → Album (image selection) → Workspace (template + edit) → Export (.zip)**

- Runs on the user's machine (`npm run start` / a launcher script), opened in a browser.
- No cloud, no auth, no external DB — everything lives in a local app-data folder.
- Output of the whole app is a **self-contained static site**: `index.html` + `assets/`.

---

## 2. Tech Stack & Architecture Decision

Browsers cannot read arbitrary folders on disk reliably/cross-browser, and we
need to persist JSON, copy image files, and zip output — all filesystem work.
**Decision:** ship a small local Node/Express backend alongside the React
frontend, both started by one local dev/prod script. This is documented as
**Decision D1** in `memory.md`.

| Layer | Choice | Why |
|---|---|---|
| Frontend | React (Vite) | Fast dev server, simple static build |
| State | React Context + hooks (Zustand optional later) | App is small/medium, avoid Redux overhead |
| Backend | Node.js + Express, local only (`localhost:PORT`) | Needed for filesystem access (read folder, copy images, write JSON, zip export) |
| Storage | Flat files: JSON per album + copied image assets | No DB needed; must stay human-inspectable |
| Image processing | `sharp` (backend, for crop/temperature/export render) + `<canvas>` (frontend live preview) | Non-destructive edits stored as params, rendered at export time |
| Zip export | `archiver` (Node) | Streams zip without loading everything in memory |
| Folder picker | Backend-driven native dialog via `electron` **not** used (pure web); use `<input webkitdirectory>` for folder selection in-browser, backend copies files client uploads/points to | Keeps this a "web (react) js" app per requirement, not Electron |
| Routing | React Router | 3 top-level routes: Dashboard, Album, Workspace |
| Dev/run | `concurrently` runs Express (port 4000) + Vite (port 5173) with a proxy, OR Express serves the Vite build directly for the "installed" local app | Single command to launch locally |

> Note: Because the user explicitly said "Platform - web (react) js" (not
> Electron), folder selection uses the HTML `<input type="file" webkitdirectory>`
> picker, which returns all files in a chosen folder (Chromium-based browsers).
> This is called out as a **platform constraint** — see `memory.md` open
> questions if the user wants full OS folder browsing (would require Electron).

---

## 3. Global Constants

```js
// src/constants/app.js
export const APP_NAME = "TripGallery"; // placeholder — change here only
export const APP_DATA_DIR = "app-data"; // backend-relative storage root
export const ALBUMS_INDEX_FILE = "albums.json";
export const DEFAULT_TEMPLATE_ID = "template-classic";
```

All UI strings referencing the app name MUST import `APP_NAME`, never hardcode it.

---

## 4. Data Model

### 4.1 Albums index — `app-data/albums.json`
```json
{
  "albums": [
    {
      "id": "alb_1234",
      "name": "Goa Trip",
      "description": "Beach weekend",
      "fromDate": "2026-01-10",
      "toDate": "2026-01-13",
      "coverImage": "assets/cover.jpg",
      "createdAt": "2026-01-15T10:00:00Z",
      "updatedAt": "2026-01-15T10:00:00Z",
      "imageCount": 128
    }
  ]
}
```

### 4.2 Per-album folder — `app-data/albums/<albumId>/`
```
album.json          # full album metadata + selection + edits + template choice
source/              # copies of all imported images (untouched originals)
   img_0001.jpg
   ...
thumbs/              # generated thumbnails for fast gallery/grid rendering
   img_0001.jpg
exports/             # zip files produced by export, timestamped
   trip-gallery-2026-01-15T1200.zip
```

### 4.3 `album.json`
```json
{
  "id": "alb_1234",
  "name": "Goa Trip",
  "description": "Beach weekend",
  "fromDate": "2026-01-10",
  "toDate": "2026-01-13",
  "images": [
    {
      "id": "img_0001",
      "file": "img_0001.jpg",
      "selected": true,
      "order": 0,
      "edits": { "crop": {"x":0,"y":0,"w":1,"h":1}, "temperature": 0 }
    }
  ],
  "templateId": "template-classic",
  "templateOptions": {
    "title": "Goa Trip",
    "description": "Beach weekend",
    "accentColor": "#2b6cb0"
  },
  "lastExportedAt": null
}
```
> `templateOptions.title` / `templateOptions.description` are **independent
> overrides** for what's displayed on the generated site — they default to
> `name` / `description` when the album is created, but the user can edit
> them separately inside the Workspace without changing the album's own
> dashboard metadata. See §6 Page 3 and §6.1 below.

### 4.4 Template manifest — `templates/<templateId>/template.json`
```json
{
  "id": "template-classic",
  "name": "Classic Grid",
  "thumbnail": "preview.png",
  "regions": ["hero", "gallery-grid", "footer"],
  "supportsFields": ["title", "description", "dateRange", "accentColor"],
  "editableFields": ["title", "description"]
}
```
> `editableFields` tells the frontend which tokens in the rendered preview
> are safe to make directly editable in-place (contenteditable) inside the
> Workspace centre panel. A template MUST mark its title/description markup
> with `data-editable="title"` / `data-editable="description"` (see
> `templates.md` for the authoring contract) for this to work.

---

## 5. Project Structure

```
trip-gallery-generator/
├── project.md
├── memory.md
├── package.json                 # root scripts: dev, build, start
├── server/                      # Express backend (local only)
│   ├── index.js                 # boots express, serves build in prod
│   ├── routes/
│   │   ├── albums.routes.js     # CRUD albums, list/create/get/delete
│   │   ├── images.routes.js     # import images into album, thumbnails
│   │   ├── templates.routes.js  # list templates, add custom template
│   │   └── export.routes.js     # render template + zip + download
│   ├── services/
│   │   ├── albumStore.js        # read/write album.json + index
│   │   ├── imageService.js      # sharp-based copy/thumbnail/crop/temp render
│   │   ├── templateEngine.js    # injects data into template HTML
│   │   └── zipService.js        # archiver-based zip building
│   └── app-data/                # runtime-created, gitignored
│       ├── albums.json
│       └── albums/<id>/...
├── templates/                    # predefined static site templates
│   ├── template-classic/
│   │   ├── template.json
│   │   ├── index.html            # tokenized: {{TITLE}}, {{GALLERY_ITEMS}}...
│   │   ├── styles.css
│   │   └── preview.png
│   └── template-minimal/
│       └── ...
├── src/                          # React frontend
│   ├── main.jsx
│   ├── App.jsx                   # Router: Dashboard / Album / Workspace
│   ├── constants/app.js
│   ├── api/
│   │   ├── albumsApi.js
│   │   ├── imagesApi.js
│   │   ├── templatesApi.js
│   │   └── exportApi.js
│   ├── context/
│   │   └── AlbumWorkspaceContext.jsx  # active album, selection, edits, template
│   ├── pages/
│   │   ├── Dashboard/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── AlbumCard.jsx           # "postcard" style album tile
│   │   │   └── NewAlbumModal.jsx       # name, description, folder, dates
│   │   ├── AlbumImageSelect/
│   │   │   ├── AlbumImageSelect.jsx
│   │   │   ├── ImageGrid.jsx
│   │   │   └── ImageThumb.jsx
│   │   └── Workspace/
│   │       ├── Workspace.jsx
│   │       ├── TemplateSidebar.jsx     # left bar: templates + "add new"
│   │       ├── TemplatePreview.jsx     # centre: live rendered template
│   │       ├── AssetSelectionBar.jsx   # bottom bar: selected images, reorder
│   │       ├── ImageEditPanel.jsx      # right bar: crop, temperature
│   │       └── ExportButton.jsx        # right-bottom: export action + progress
│   ├── components/                     # shared: Button, Modal, DatePicker...
│   └── styles/
├── public/
└── dist/                                # Vite build output, served by Express
```

---

## 6. Page-by-Page Spec

### Page 1 — Dashboard
- Fetches `GET /api/albums` → renders postcard-style `AlbumCard` grid (cover image, name, date range).
- "Create New Album" → `NewAlbumModal`:
  - Fields: name, description, from/to date, folder picker (`<input webkitdirectory>`).
  - On submit → `POST /api/albums` (metadata) then `POST /api/albums/:id/images/import` (uploads the picked files; backend copies into `source/` + generates `thumbs/`).
  - New album appears in dashboard list.
- Click album → navigate to `/album/:id` (Page 2).

### Page 2 — Album Image Selection
- `GET /api/albums/:id` + `GET /api/albums/:id/images` → grid of thumbnails.
- Click toggles `selected`. Multi-select, select-all/none helpers.
- "Next" → `PATCH /api/albums/:id` saves selection → navigate to `/workspace/:id`.

### Page 3 — Workspace
- **Left bar:** `TemplateSidebar` — list from `GET /api/templates`; "+ Add new template" opens upload flow (zip of an HTML/CSS template validated against `template.json` schema).
- **Centre:** `TemplatePreview` — iframe rendering the selected template with current selected images injected (calls `templateEngine` preview endpoint, debounced). Elements marked `data-editable="title"` / `data-editable="description"` in the template are rendered as **inline-editable** (contenteditable) directly on the canvas — see §6.1.
- **Bottom bar:** `AssetSelectionBar` — filmstrip of selected images, drag to reorder, remove from selection without leaving workspace.
- **Right bar:** `ImageEditPanel` — for the currently focused image: crop (draggable rect on canvas) and temperature (slider, canvas filter preview). Saves to `edits` in `album.json` on change (debounced `PATCH`).
- **Right-bottom:** `ExportButton` → `POST /api/albums/:id/export` → backend renders final images (sharp applies crop/temperature), injects into template, zips → returns downloadable file → saved under `exports/`.

### 6.1 Editing heading & description from the Workspace

Requirement: the user should not have to leave the Workspace or reopen the
"new album" form to fix the title/subtitle that will appear on the generated
site.

- `TemplatePreview` renders inside an `iframe` (or shadow DOM) so template
  CSS doesn't leak into the app shell. The frontend post-processes the
  rendered markup: any node with `data-editable="title"` or
  `data-editable="description"` gets `contenteditable="true"` and a light
  focus outline (app-injected, not part of the template's own CSS).
- On blur / debounced input, the new text is sent via
  `PATCH /api/albums/:id` with `{ templateOptions: { title, description } }`
  and written into `album.json` (§4.3). The preview re-renders from the
  saved value on next full reload; local typing state is optimistic.
- These overrides are **per-album**, not per-template — switching templates
  in the left bar keeps the edited title/description and simply re-injects
  them into the newly selected template's `data-editable` nodes (if that
  template doesn't define one of them, the field is just not shown, no data
  is lost).
- Fallback: if a template lacks `data-editable` markup entirely (an older or
  minimal template), the right bar (or a small "Page details" affordance
  above the preview) falls back to plain text inputs for title/description
  bound to the same `templateOptions` fields, so editing is always possible
  even without in-canvas contenteditable support.
- Template authoring contract for this (what markup a template must include,
  token names, and validation rules) is fully specified in **`templates.md`**
  — read that file before generating or adding any new predefined template.

---

## 7. Backend API Surface

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/albums` | list albums (dashboard) |
| POST | `/api/albums` | create album (metadata only) |
| GET | `/api/albums/:id` | album detail |
| PATCH | `/api/albums/:id` | update metadata / selection / templateId / options |
| DELETE | `/api/albums/:id` | delete album + files |
| POST | `/api/albums/:id/images/import` | import images from chosen folder into album |
| GET | `/api/albums/:id/images` | list images + thumbs |
| PATCH | `/api/albums/:id/images/:imageId` | update per-image edit params |
| GET | `/api/templates` | list predefined + custom templates |
| POST | `/api/templates` | add a new custom template (upload) |
| POST | `/api/albums/:id/preview` | render current template+data to HTML for iframe preview |
| POST | `/api/albums/:id/export` | render final site, zip, return download URL |

---

## 8. Template Engine Design

- Templates are plain `index.html` + `styles.css` with tokens: `{{TITLE}}`,
  `{{DESCRIPTION}}`, `{{DATE_RANGE}}`, `{{GALLERY_ITEMS}}` (loop block between
  `<!--GALLERY_ITEM_START-->...<!--GALLERY_ITEM_END-->` duplicated per image).
- `templateEngine.js` does simple string templating (no heavy engine needed);
  keeps templates easy for non-devs to author/add via "add new template".
- Export copies the template's `styles.css` and any static assets, writes
  processed images into `assets/`, writes final `index.html`, zips the folder.
- **Full authoring contract lives in `templates.md`** (repo root, alongside
  `project.md`): token list, required `data-editable` markup for inline
  Workspace editing (§6.1), the `template.json` schema, offline/self-contained
  constraints, and a worked example. `templates.md` is written so it can be
  handed to Claude later as a standalone prompt/spec to generate new
  predefined templates that the app can consume without modification —
  always check any newly generated template against its checklist before
  dropping it into `/templates`.

---

## 9. Implementation Phases (build order)

1. **Phase 0 — Scaffold**: root package.json, Vite React app, Express server, `concurrently` dev script, `constants/app.js`, base routing shell (3 empty pages).
2. **Phase 1 — Data layer**: `albumStore.js` (index + per-album json read/write), albums CRUD routes, Dashboard page wired to real create/list.
3. **Phase 2 — Image import**: folder picker, backend copy + thumbnail generation (`imageService.js`), Album Image Selection page with real thumbnails + selection persistence.
4. **Phase 3 — Templates (static)**: build 2 predefined templates, `templates.routes.js` list endpoint, `TemplateSidebar` + `TemplatePreview` (static preview first, no live data yet).
5. **Phase 4 — Workspace data wiring**: `AssetSelectionBar` reorder/remove, live preview injecting real selected images/data into template iframe.
6. **Phase 5 — Editing**: `ImageEditPanel` (crop UI + temperature slider), canvas live preview, save edit params to `album.json`.
7. **Phase 6 — Export**: `zipService.js`, export route applying edits via `sharp`, template rendering to final static output, `ExportButton` with progress + download.
8. **Phase 7 — Add-new-template flow**: upload/validate custom template zip against `template.json` schema.
9. **Phase 8 — Polish**: error states, empty states, loading skeletons, basic tests.

Each phase completion = update `memory.md` (status table + decisions + next steps).

---

## 10. Open Questions (track resolutions in `memory.md`)

- Folder picker is browser-native (`webkitdirectory`) — acceptable, or should this become an Electron app for full native folder browsing + double-click launch icon?
- Should thumbnails/edits be regenerated on every export, or cached until source/edits change?
- Multi-window/multi-user on same machine — out of scope for v1 (single local user assumed).
