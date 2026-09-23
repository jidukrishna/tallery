import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getAlbum, saveAlbum, getAlbumPath } from '../services/albumStore.js';
import { renderTemplate } from '../services/templateEngine.js';
import { processImageForExport } from '../services/imageService.js';
import { zipDirectory } from '../services/zipService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');

const router = express.Router({ mergeParams: true });

// POST /api/albums/:id/export
router.post('/', async (req, res) => {
  let stagingDir = null;
  try {
    const albumId = req.params.id;
    const album = getAlbum(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const templateId = album.templateId || 'template-classic';
    const templateDir = path.join(TEMPLATES_DIR, templateId);
    if (!fs.existsSync(templateDir)) {
      return res.status(404).json({ error: `Template "${templateId}" not found` });
    }

    const albumFolder = getAlbumPath(albumId);
    const exportsFolder = path.join(albumFolder, 'exports');
    if (!fs.existsSync(exportsFolder)) {
      fs.mkdirSync(exportsFolder, { recursive: true });
    }

    // Timestamped name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const cleanAlbumName = (album.name || 'trip')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    const zipFilename = `${cleanAlbumName}-${timestamp}.zip`;
    const zipFilePath = path.join(exportsFolder, zipFilename);

    // Staging directory
    stagingDir = path.join(PROJECT_ROOT, 'app-data', `export_stage_${albumId}_${Date.now()}`);
    const stagingAssetsDir = path.join(stagingDir, 'assets');
    fs.mkdirSync(stagingAssetsDir, { recursive: true });

    // 1. Copy template styles.css and any other non-html/non-json template files
    const templateFiles = fs.readdirSync(templateDir);
    for (const file of templateFiles) {
      if (file !== 'index.html' && file !== 'template.json' && file !== 'preview.png') {
        const srcPath = path.join(templateDir, file);
        const destPath = path.join(stagingDir, file);
        if (fs.statSync(srcPath).isFile()) {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    // 2. Process images with sharp (crop, temperature)
    const selectedImages = (album.images || [])
      .filter((img) => img.selected)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const sourceDir = path.join(albumFolder, 'source');
    for (const img of selectedImages) {
      const sourcePath = path.join(sourceDir, img.file);
      const destPath = path.join(stagingAssetsDir, img.file);

      if (fs.existsSync(sourcePath)) {
        await processImageForExport(sourcePath, destPath, img.edits || {});
      }
    }

    // 3. Render final index.html
    const finalHtml = renderTemplate(templateDir, album, { isPreview: false });
    fs.writeFileSync(path.join(stagingDir, 'index.html'), finalHtml, 'utf-8');

    // 4. Zip staging folder
    await zipDirectory(stagingDir, zipFilePath);

    // 5. Update album metadata
    album.lastExportedAt = new Date().toISOString();
    album.updatedAt = album.lastExportedAt;
    saveAlbum(albumId, album);

    res.json({
      success: true,
      filename: zipFilename,
      downloadUrl: `/api/albums/${albumId}/export/${zipFilename}`,
    });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    // Cleanup staging folder
    if (stagingDir && fs.existsSync(stagingDir)) {
      try {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      } catch {}
    }
  }
});

// GET /api/albums/:id/exports/:filename - Download zip file
router.get('/:filename', (req, res) => {
  try {
    const { id, filename } = req.params;
    // Security check against directory traversal
    const safeFilename = path.basename(filename);
    const albumFolder = getAlbumPath(id);
    const filePath = path.join(albumFolder, 'exports', safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Export file not found' });
    }

    res.download(filePath, safeFilename);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
