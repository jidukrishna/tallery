import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getAlbumsIndex,
  getAlbum,
  saveAlbum,
  createAlbum,
  deleteAlbum,
} from '../services/albumStore.js';
import { renderTemplate } from '../services/templateEngine.js';

const router = express.Router();

// GET /api/albums - List all albums
router.get('/', (req, res) => {
  try {
    const index = getAlbumsIndex();
    res.json(index.albums || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/albums - Create album metadata
router.post('/', (req, res) => {
  try {
    const { name, description, fromDate, toDate } = req.body;
    const album = createAlbum({ name, description, fromDate, toDate });
    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/albums/:id - Get full album detail
router.get('/:id', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/albums/:id - Update album
router.patch('/:id', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const {
      name,
      description,
      fromDate,
      toDate,
      images,
      templateId,
      templateOptions,
      coverImage,
    } = req.body;

    if (name !== undefined) album.name = name;
    if (description !== undefined) album.description = description;
    if (fromDate !== undefined) album.fromDate = fromDate;
    if (toDate !== undefined) album.toDate = toDate;
    if (images !== undefined) album.images = images;
    if (templateId !== undefined) album.templateId = templateId;
    if (coverImage !== undefined) album.coverImage = coverImage;
    if (templateOptions !== undefined) {
      album.templateOptions = {
        ...album.templateOptions,
        ...templateOptions,
      };
    }

    album.updatedAt = new Date().toISOString();
    saveAlbum(album.id, album);
    res.json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/albums/:id/preview - Render HTML for iframe preview
router.post('/:id/preview', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    const templateId = album.templateId || 'template-classic';
    const templateDir = path.join(PROJECT_ROOT, 'templates', templateId);

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

// DELETE /api/albums/:id - Delete album
router.delete('/:id', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    deleteAlbum(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
