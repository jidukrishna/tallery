# Templates Authoring Guide

> **Purpose of this file:** this is the contract a predefined trip-gallery
> template must follow to work with the app's template engine
> (`server/services/templateEngine.js`) and Workspace inline editor (see
> `project.md` §6.1, §8). It is written to be **self-contained enough to hand
> to Claude on its own**, later in the project, as the spec for generating a
> new template: *"Here is templates.md — generate a new template folder
> called `template-<name>` in this style: ..."* Claude (or a human) should
> be able to produce a working template from this document alone, without
> needing the rest of the codebase for context.

---

## 1. What a template is

A template is a **static HTML/CSS site skeleton** with placeholder tokens.
The backend `templateEngine.js` does simple string substitution — no build
step, no JS framework — so the output works by double-clicking `index.html`
after export, with zero dependencies.

Each template is a folder under `/templates/<template-id>/`:

```
templates/template-<name>/
├── template.json      # manifest (required)
├── index.html          # tokenized HTML (required)
├── styles.css           # all styling (required)
└── preview.png          # thumbnail shown in the Workspace left sidebar (required, ~800x600)
```

---

## 2. `template.json` schema

```json
{
  "id": "template-classic",
  "name": "Classic Grid",
  "description": "A clean centered hero with a responsive photo grid below.",
  "thumbnail": "preview.png",
  "regions": ["hero", "gallery-grid", "footer"],
  "supportsFields": ["title", "description", "dateRange", "accentColor"],
  "editableFields": ["title", "description"]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | must equal the folder name, kebab-case, unique across `/templates` |
| `name` | yes | human-readable, shown in the sidebar |
| `description` | yes | one line, shown as a tooltip/caption in the sidebar |
| `thumbnail` | yes | filename of the preview image inside the same folder |
| `regions` | yes | logical sections the layout is built from (free-form, for documentation/debugging only) |
| `supportsFields` | yes | which of `title`, `description`, `dateRange`, `accentColor` the template actually renders somewhere |
| `editableFields` | yes | subset of `supportsFields` that are wrapped in `data-editable="..."` markup (see §4) and therefore support in-canvas Workspace editing |

---

## 3. Tokens (string-substituted by `templateEngine.js`)

Use these tokens verbatim inside `index.html` / `styles.css`. The engine does
a literal find-and-replace, so exact casing and braces matter.

| Token | Replaced with |
|---|---|
| `{{TITLE}}` | `templateOptions.title` (falls back to album `name`) |
| `{{DESCRIPTION}}` | `templateOptions.description` (falls back to album `description`) |
| `{{DATE_RANGE}}` | pre-formatted string, e.g. `Jan 10 – Jan 13, 2026` |
| `{{ACCENT_COLOR}}` | hex color, e.g. `#2b6cb0` — use inside inline `style="..."` or as a CSS custom property value |
| `{{GALLERY_ITEMS}}` | not used directly — see the loop block below |

### Gallery loop block

Selected images are repeated using an HTML-comment-delimited block. Put
**exactly one** such block anywhere in `index.html`; the engine duplicates
everything between the markers once per selected image, substituting
per-image tokens each time, then drops the markers themselves:

```html
<div class="gallery-grid">
  <!--GALLERY_ITEM_START-->
  <figure class="gallery-item">
    <img src="assets/{{IMAGE_FILE}}" alt="{{IMAGE_ALT}}" loading="lazy" />
  </figure>
  <!--GALLERY_ITEM_END-->
</div>
```

Per-image tokens available only inside this block:

| Token | Replaced with |
|---|---|
| `{{IMAGE_FILE}}` | exported filename, e.g. `img_0001.jpg` (always relative to `assets/`) |
| `{{IMAGE_ALT}}` | album title + index, e.g. `Goa Trip photo 3`, unless a future per-image caption field is added |
| `{{IMAGE_INDEX}}` | 1-based position in the selected/ordered list |

---

## 4. Inline-editable regions (`data-editable`)

To support editing the heading/description **directly in the Workspace
preview** (`project.md` §6.1), wrap the elements that render `{{TITLE}}` and
`{{DESCRIPTION}}` with a `data-editable` attribute naming the field:

```html
<header class="hero">
  <h1 data-editable="title">{{TITLE}}</h1>
  <p data-editable="description">{{DESCRIPTION}}</p>
  <span class="date-range">{{DATE_RANGE}}</span>
</header>
```

Rules:
- `data-editable` value must be one of the strings listed in the template's
  own `editableFields` array in `template.json` — the frontend only makes
  nodes editable if both the attribute and the manifest agree.
- The element must contain **only** the token text (plus whitespace) — no
  nested interactive elements (no buttons/links/inputs inside it), since the
  frontend makes the whole node `contenteditable`.
- Exactly one `data-editable="title"` and at most one
  `data-editable="description"` node per template. If a template has no use
  for a description (e.g. a very minimal hero), omit it from both the markup
  and `editableFields`/`supportsFields` — the Workspace will fall back to a
  plain text input above the preview for that field instead (see
  `project.md` §6.1).
- Do not put a token inside a `data-editable` element that isn't `{{TITLE}}`
  or `{{DESCRIPTION}}` — only those two fields are ever made editable this
  way; `{{DATE_RANGE}}` and `{{ACCENT_COLOR}}` are edited elsewhere in the
  Workspace UI (date fields, color picker), never inline.

---

## 5. Hard constraints (exported site must work fully offline)

The exported zip is opened by double-clicking `index.html` — it must never
depend on network access:

- **No external requests of any kind**: no CDN scripts, no Google Fonts
  `<link>`, no remote images, no analytics/tracking snippets, no `fetch`.
- **No JS frameworks required.** Plain vanilla `<script>` is allowed only for
  small enhancements (e.g. a lightbox on click) and must be inlined or placed
  in a local `.js` file shipped inside the template folder — never loaded
  from a CDN.
- **Self-contained CSS.** All styling in `styles.css`, no external
  stylesheet imports. Use a system font stack
  (e.g. `font-family: -apple-system, "Segoe UI", Roboto, sans-serif;`)
  rather than a web font, unless the font file itself is bundled in the
  template folder and referenced with a relative `@font-face` path.
- **Relative paths only.** Images are always referenced as `assets/<file>`;
  never absolute paths, never `file://` paths baked in.
- **Responsive.** Must render reasonably from ~360px mobile width up to
  desktop — use CSS grid/flexbox with relative units, `max-width: 100%` on
  images.
- **Keep it a single HTML file + one CSS file (+ optional one JS file).** No
  build step, no bundler output, no `node_modules` — this is what
  `templateEngine.js` copies verbatim (aside from token substitution) into
  the export.

---

## 6. Worked example (minimal valid template)

`templates/template-minimal/template.json`
```json
{
  "id": "template-minimal",
  "name": "Minimal",
  "description": "Full-bleed photo grid with a single-line title bar.",
  "thumbnail": "preview.png",
  "regions": ["header", "gallery-grid"],
  "supportsFields": ["title", "dateRange", "accentColor"],
  "editableFields": ["title"]
}
```

`templates/template-minimal/index.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{TITLE}}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="bar" style="border-color: {{ACCENT_COLOR}};">
    <h1 data-editable="title">{{TITLE}}</h1>
    <span class="date-range">{{DATE_RANGE}}</span>
  </header>
  <main class="gallery-grid">
    <!--GALLERY_ITEM_START-->
    <figure class="gallery-item">
      <img src="assets/{{IMAGE_FILE}}" alt="{{IMAGE_ALT}}" loading="lazy" />
    </figure>
    <!--GALLERY_ITEM_END-->
  </main>
</body>
</html>
```

`templates/template-minimal/styles.css`
```css
:root { color-scheme: light; }
body { margin: 0; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; }
.bar {
  padding: 24px 32px;
  border-bottom: 4px solid #2b6cb0;
  display: flex;
  align-items: baseline;
  gap: 16px;
}
.bar h1 { margin: 0; font-size: 1.6rem; }
.date-range { color: #666; font-size: 0.9rem; }
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 4px;
  padding: 4px;
}
.gallery-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
@media (max-width: 480px) {
  .bar { flex-direction: column; gap: 4px; padding: 16px; }
}
```

This template is intentionally minimal — no description field, no JS — to
show the smallest valid template. Richer templates add more `regions`,
optional `{{DESCRIPTION}}`, hero images, lightbox JS, etc., while still
following §3–§5.

---

## 7. Checklist before adding a new template to `/templates`

- [ ] Folder name == `template.json` `id`, kebab-case, not already taken
- [ ] `template.json` valid against the schema in §2
- [ ] Every token used in `index.html`/`styles.css` is from the list in §3
- [ ] Exactly one `GALLERY_ITEM_START`/`END` block present
- [ ] `data-editable="title"` present and matches `editableFields`; same for `description` if used
- [ ] No `data-editable` element contains nested interactive markup
- [ ] No external network calls, CDN links, or remote fonts/images anywhere
- [ ] Renders correctly at ~360px width (quick manual check)
- [ ] `preview.png` added and matches what the template actually looks like
- [ ] Opens correctly via double-clicking `index.html` after a real export (no localhost/dev-server dependency)

---

## 8. How this file will be used later

When it's time to add more predefined templates, the intended workflow is:

1. Describe the desired visual style in a prompt (e.g. "a warm, travel-journal
   style template with a full-bleed hero photo and a masonry gallery below").
2. Paste/attach this `templates.md` file as the spec.
3. Ask Claude to generate the four files (`template.json`, `index.html`,
   `styles.css`, `preview.png` description) following §2–§6 exactly.
4. Run the file through the §7 checklist before dropping it into
   `/templates/template-<name>/`.
5. Restart the app (or hit the templates list endpoint) — it should appear
   automatically in the Workspace left sidebar via `GET /api/templates`.
