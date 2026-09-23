import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import sharp from 'sharp';

import albumsRouter from '../server/routes/albums.routes.js';
import exportRouter from '../server/routes/export.routes.js';
import { createAlbum, deleteAlbum, getAlbumPath, saveAlbum } from '../server/services/albumStore.js';
import { generateThumbnail } from '../server/services/imageService.js';

const app = express();
app.use(express.json());
app.use('/api/albums/:id/export', exportRouter);
app.use('/api/albums', albumsRouter);

let server;
let baseUrl;
let testAlbum;

describe('Export Pipeline Integration Test', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Create a real album with test image files
    testAlbum = createAlbum({
      name: 'Goa Holiday',
      description: 'Sunny beaches',
      fromDate: '2026-01-10',
      toDate: '2026-01-15',
    });

    const albumFolder = getAlbumPath(testAlbum.id);
    const sourceDir = path.join(albumFolder, 'source');
    const thumbsDir = path.join(albumFolder, 'thumbs');

    // Generate 2 sample source images
    for (let i = 1; i <= 2; i++) {
      const filename = `photo_${i}.jpg`;
      const sourceFile = path.join(sourceDir, filename);
      const thumbFile = path.join(thumbsDir, filename);

      await sharp({
        create: {
          width: 600,
          height: 400,
          channels: 3,
          background: i === 1 ? { r: 255, g: 100, b: 50 } : { r: 50, g: 150, b: 255 },
        },
      }).jpeg().toFile(sourceFile);

      await generateThumbnail(sourceFile, thumbFile);

      testAlbum.images.push({
        id: `img_${i}`,
        file: filename,
        selected: true,
        order: i - 1,
        edits: {
          crop: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },
          temperature: 15,
        },
      });
    }

    saveAlbum(testAlbum.id, testAlbum);
  });

  after(async () => {
    if (testAlbum) {
      deleteAlbum(testAlbum.id);
    }
    await new Promise((resolve) => server.close(resolve));
  });

  test('POST /api/albums/:id/export generates valid standalone zip', async () => {
    const res = await fetch(`${baseUrl}/api/albums/${testAlbum.id}/export`, {
      method: 'POST',
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.success);
    assert.ok(data.filename);
    assert.ok(data.downloadUrl);

    // Download the zip
    const downloadRes = await fetch(`${baseUrl}${data.downloadUrl}`);
    assert.equal(downloadRes.status, 200);
    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Inspect zip contents
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries().map((e) => e.entryName);

    assert.ok(zipEntries.includes('index.html'), 'Zip must contain index.html');
    assert.ok(zipEntries.includes('styles.css'), 'Zip must contain styles.css');
    assert.ok(zipEntries.includes('assets/photo_1.jpg'), 'Zip must contain assets/photo_1.jpg');
    assert.ok(zipEntries.includes('assets/photo_2.jpg'), 'Zip must contain assets/photo_2.jpg');

    // Verify index.html content inside the zip
    const indexEntry = zip.getEntry('index.html');
    const indexHtml = indexEntry.getData().toString('utf-8');
    assert.ok(indexHtml.includes('Goa Holiday'), 'Index.html has album title');
    assert.ok(indexHtml.includes('assets/photo_1.jpg'), 'Index.html has photo reference');
    // Ensure no external http links exist (offline constraint)
    assert.ok(!/https?:\/\//i.test(indexHtml), 'Index.html is completely offline');
  });
});

