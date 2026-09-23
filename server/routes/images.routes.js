import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { getAlbum, saveAlbum, getAlbumPath } from '../services/albumStore.js';
import { generateThumbnail } from '../services/imageService.js';

const router = express.Router({ mergeParams: true });

// Setup multer memory or disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const albumId = req.params.id;
    const albumFolder = getAlbumPath(albumId);
    const sourceDir = path.join(albumFolder, 'source');
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }
    cb(null, sourceDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueName = `${nanoid(6)}_${safeName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per image
});

// POST /api/albums/:id/images/import
router.post('/import', upload.array('images'), async (req, res) => {
  try {
    const albumId = req.params.id;
    const album = getAlbum(albumId);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files uploaded' });
    }

    const albumFolder = getAlbumPath(albumId);
    const thumbsDir = path.join(albumFolder, 'thumbs');
    if (!fs.existsSync(thumbsDir)) {
      fs.mkdirSync(thumbsDir, { recursive: true });
    }

    if (!album.images) {
      album.images = [];
    }

    const initialOrder = album.images.length;
    const newImages = [];

    // Process thumbnails
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const filename = file.filename;
      const sourcePath = file.path;
      const thumbPath = path.join(thumbsDir, filename);

      try {
        await generateThumbnail(sourcePath, thumbPath);
      } catch (err) {
        console.error(`Error generating thumbnail for ${filename}:`, err);
        // Fallback: copy file directly to thumbs if sharp fails on non-standard format
        fs.copyFileSync(sourcePath, thumbPath);
      }

      const imageItem = {
        id: `img_${nanoid(8)}`,
        file: filename,
        originalName: file.originalname,
        selected: true,
        order: initialOrder + i,
        edits: {
          crop: { x: 0, y: 0, w: 1, h: 1 },
          temperature: 0,
        },
      };

      album.images.push(imageItem);
      newImages.push(imageItem);
    }

    album.updatedAt = new Date().toISOString();
    saveAlbum(albumId, album);

    res.status(201).json({
      importedCount: newImages.length,
      images: album.images,
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/albums/:id/images
router.get('/', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const images = (album.images || []).map((img) => ({
      ...img,
      thumbUrl: `/app-data/albums/${album.id}/thumbs/${img.file}`,
      sourceUrl: `/app-data/albums/${album.id}/source/${img.file}`,
    }));

    res.json(images);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/albums/:id/images/:imageId
router.patch('/:imageId', (req, res) => {
  try {
    const album = getAlbum(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    const imgIndex = (album.images || []).findIndex((i) => i.id === req.params.imageId);
    if (imgIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const { edits, selected, order } = req.body;
    if (edits !== undefined) {
      album.images[imgIndex].edits = {
        ...album.images[imgIndex].edits,
        ...edits,
      };
    }
    if (selected !== undefined) {
      album.images[imgIndex].selected = Boolean(selected);
    }
    if (order !== undefined) {
      album.images[imgIndex].order = Number(order);
    }

    album.updatedAt = new Date().toISOString();
    saveAlbum(album.id, album);

    res.json(album.images[imgIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

