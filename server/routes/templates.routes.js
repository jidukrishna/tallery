import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { getAlbum } from '../services/albumStore.js';
import { renderTemplate } from '../services/templateEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

const router = express.Router();

const upload = multer({
  dest: path.join(PROJECT_ROOT, 'app-data', 'temp-uploads'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB zip limit
});

function ensureTemplatesDir() {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
  }
}

// GET /api/templates - List all available templates
router.get('/', (req, res) => {
  try {
    ensureTemplatesDir();
    const entries = fs.readdirSync(TEMPLATES_DIR, { withFileTypes: true });
    const templates = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const manifestPath = path.join(TEMPLATES_DIR, entry.name, 'template.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            templates.push({
              ...manifest,
              id: entry.name,
              thumbUrl: `/templates/${entry.name}/${manifest.thumbnail || 'preview.png'}`,
            });
          } catch (err) {
            console.error(`Invalid template manifest in ${entry.name}:`, err);
          }
        }
      }
    }

    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/templates - Upload and validate custom template zip
router.post('/', upload.single('templateZip'), (req, res) => {
  let tempExtractDir = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No template zip file uploaded' });
    }

    const zip = new AdmZip(req.file.path);
    const tempExtractName = `extract_${Date.now()}`;
    tempExtractDir = path.join(PROJECT_ROOT, 'app-data', tempExtractName);
    zip.extractAllTo(tempExtractDir, true);

    // Some zips contain a single top-level folder
    let targetDir = tempExtractDir;
    const extractedItems = fs.readdirSync(tempExtractDir);
    if (extractedItems.length === 1 && fs.statSync(path.join(tempExtractDir, extractedItems[0])).isDirectory()) {
      targetDir = path.join(tempExtractDir, extractedItems[0]);
    }

    // Validation per templates.md
    const manifestPath = path.join(targetDir, 'template.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Template is missing template.json manifest');
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (!manifest.id || !manifest.name || !manifest.regions || !manifest.supportsFields || !manifest.editableFields) {
      throw new Error('template.json is missing required fields (id, name, regions, supportsFields, editableFields)');
    }

    const indexHtmlPath = path.join(targetDir, 'index.html');
    if (!fs.existsSync(indexHtmlPath)) {
      throw new Error('Template is missing index.html');
    }

    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    if (!html.includes('<!--GALLERY_ITEM_START-->') || !html.includes('<!--GALLERY_ITEM_END-->')) {
      throw new Error('Template index.html must contain <!--GALLERY_ITEM_START--> and <!--GALLERY_ITEM_END--> block');
    }

    // Check for prohibited external resources
    if (/https?:\/\//i.test(html)) {
      throw new Error('Templates must be self-contained and cannot include external http/https URLs or CDN links');
    }

    const stylesPath = path.join(targetDir, 'styles.css');
    if (!fs.existsSync(stylesPath)) {
      throw new Error('Template is missing styles.css');
    }

    // Destination
    ensureTemplatesDir();
    const destDir = path.join(TEMPLATES_DIR, manifest.id);
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
    }
    fs.cpSync(targetDir, destDir, { recursive: true });

    res.status(201).json({
      success: true,
      template: {
        ...manifest,
        thumbUrl: `/templates/${manifest.id}/${manifest.thumbnail || 'preview.png'}`,
      },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    // Cleanup uploaded temp files
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    if (tempExtractDir && fs.existsSync(tempExtractDir)) {
      try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch {}
    }
  }
});

// POST /api/albums/:id/preview - Render HTML for iframe preview
router.post('/preview/:id', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const templateId = album.templateId || 'template-classic';
    const templateDir = path.join(TEMPLATES_DIR, templateId);

    if (!fs.existsSync(templateDir)) {
      return res.status(404).json({ error: `Template "${templateId}" not found` });
    }

    const html = renderTemplate(templateDir, album, { isPreview: true });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    console.error('Preview error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

