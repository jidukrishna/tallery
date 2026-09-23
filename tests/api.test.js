import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import albumsRouter from '../server/routes/albums.routes.js';
import templatesRouter from '../server/routes/templates.routes.js';
import imagesRouter from '../server/routes/images.routes.js';
import exportRouter from '../server/routes/export.routes.js';
import { deleteAlbum } from '../server/services/albumStore.js';

const app = express();
app.use(express.json());
app.use('/api/albums/:id/images', imagesRouter);
app.use('/api/albums/:id/export', exportRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/templates', templatesRouter);

let server;
let baseUrl;
let createdAlbumId;

describe('TripGallery API Routes Test Suite', () => {
  before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (createdAlbumId) {
      deleteAlbum(createdAlbumId);
    }
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/templates returns predefined templates', async () => {
    const res = await fetch(`${baseUrl}/api/templates`);
    assert.equal(res.status, 200);
    const templates = await res.json();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.length >= 2);
    const classic = templates.find((t) => t.id === 'template-classic');
    const minimal = templates.find((t) => t.id === 'template-minimal');
    assert.ok(classic, 'Classic template should exist');
    assert.ok(minimal, 'Minimal template should exist');
    assert.ok(classic.editableFields.includes('title'));
  });

  test('POST, GET, PATCH, DELETE /api/albums', async () => {
    // 1. Create album
    const createRes = await fetch(`${baseUrl}/api/albums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Santorini Sunset',
        description: 'Greek islands voyage',
        fromDate: '2026-06-01',
        toDate: '2026-06-08',
      }),
    });
    assert.equal(createRes.status, 201);
    const album = await createRes.json();
    assert.ok(album.id);
    createdAlbumId = album.id;
    assert.equal(album.name, 'Santorini Sunset');

    // 2. Fetch all albums
    const listRes = await fetch(`${baseUrl}/api/albums`);
    assert.equal(listRes.status, 200);
    const list = await listRes.json();
    assert.ok(list.find((a) => a.id === album.id));

    // 3. Patch album template options
    const patchRes = await fetch(`${baseUrl}/api/albums/${album.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateOptions: {
          title: 'Santorini 2026',
          description: 'Sunsets & white alleys',
          accentColor: '#0ea5e9',
        },
      }),
    });
    assert.equal(patchRes.status, 200);
    const updated = await patchRes.json();
    assert.equal(updated.templateOptions.title, 'Santorini 2026');

    // 4. Test preview endpoint
    const previewRes = await fetch(`${baseUrl}/api/albums/${album.id}/preview`, {
      method: 'POST',
    });
    assert.equal(previewRes.status, 200);
    const previewHtml = await previewRes.text();
    assert.ok(previewHtml.includes('Santorini 2026'));
    assert.ok(previewHtml.includes('data-editable="title"'));

    // 5. Delete album
    const delRes = await fetch(`${baseUrl}/api/albums/${album.id}`, {
      method: 'DELETE',
    });
    assert.equal(delRes.status, 200);
    createdAlbumId = null;

    const fetchDeleted = await fetch(`${baseUrl}/api/albums/${album.id}`);
    assert.equal(fetchDeleted.status, 404);
  });
});

