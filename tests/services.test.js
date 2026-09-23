import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

import { createAlbum, getAlbum, saveAlbum, getAlbumsIndex, deleteAlbum } from '../server/services/albumStore.js';
import { formatDateRange, renderTemplate } from '../server/services/templateEngine.js';
import { generateThumbnail, processImageForExport } from '../server/services/imageService.js';
import { zipDirectory } from '../server/services/zipService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DIR = path.join(__dirname, 'temp-test');

describe('TripGallery Services Test Suite', () => {
  let createdAlbumId = null;

  before(async () => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  after(() => {
    if (createdAlbumId) {
      deleteAlbum(createdAlbumId);
    }
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  test('albumStore: create, get, update, index', () => {
    const album = createAlbum({
      name: 'Test Kyoto Trip',
      description: 'Spring temples and tea houses',
      fromDate: '2026-03-10',
      toDate: '2026-03-18',
    });

    assert.ok(album.id.startsWith('alb_'));
    createdAlbumId = album.id;
    assert.equal(album.name, 'Test Kyoto Trip');
    assert.equal(album.templateOptions.title, 'Test Kyoto Trip');

    const fetched = getAlbum(album.id);
    assert.equal(fetched.id, album.id);
    assert.equal(fetched.description, 'Spring temples and tea houses');

    fetched.name = 'Updated Kyoto Trip';
    saveAlbum(album.id, fetched);

    const updated = getAlbum(album.id);
    assert.equal(updated.name, 'Updated Kyoto Trip');

    const index = getAlbumsIndex();
    const foundInIndex = index.albums.find(a => a.id === album.id);
    assert.ok(foundInIndex);
    assert.equal(foundInIndex.name, 'Updated Kyoto Trip');
  });

  test('templateEngine: date range formatting and token rendering', () => {
    assert.equal(formatDateRange('2026-01-10', '2026-01-13'), 'Jan 10 – 13, 2026');
    assert.equal(formatDateRange('2026-01-10', '2026-02-05'), 'Jan 10 – Feb 5, 2026');

    const sampleAlbum = {
      id: 'alb_demo',
      name: 'Summer in Swiss',
      description: 'Hiking the Alps',
      fromDate: '2026-07-01',
      toDate: '2026-07-10',
      templateOptions: {
        title: 'Swiss Alps 2026',
        description: 'Hiking trails & mountains',
        accentColor: '#e11d48',
      },
      images: [
        { file: 'photo1.jpg', selected: true, order: 0 },
        { file: 'photo2.jpg', selected: false, order: 1 },
        { file: 'photo3.jpg', selected: true, order: 2 },
      ],
    };

    const templateClassicDir = path.resolve(__dirname, '../templates/template-classic');
    const html = renderTemplate(templateClassicDir, sampleAlbum, { isPreview: false });

    assert.ok(html.includes('Swiss Alps 2026'));
    assert.ok(html.includes('Hiking trails & mountains'));
    assert.ok(html.includes('assets/photo1.jpg'));
    assert.ok(html.includes('assets/photo3.jpg'));
    // photo2 was not selected, so it should not be in the output
    assert.ok(!html.includes('assets/photo2.jpg'));
    assert.ok(html.includes('data-editable="title"'));
  });

  test('imageService: thumbnail generation and export transforms', async () => {
    const testImgPath = path.join(TEST_DIR, 'source.jpg');
    const thumbPath = path.join(TEST_DIR, 'thumb.jpg');
    const exportPath = path.join(TEST_DIR, 'export.jpg');

    // Create 800x600 test image with colored squares
    await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    }).jpeg().toFile(testImgPath);

    // Test thumbnail
    await generateThumbnail(testImgPath, thumbPath);
    const thumbMeta = await sharp(thumbPath).metadata();
    assert.ok(thumbMeta.width <= 400);
    assert.ok(thumbMeta.height <= 400);

    // Test crop and temperature
    await processImageForExport(testImgPath, exportPath, {
      crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 },
      temperature: 30, // warm
    });

    const exportMeta = await sharp(exportPath).metadata();
    assert.equal(exportMeta.width, 400); // 50% of 800
    assert.equal(exportMeta.height, 300); // 50% of 600
  });

  test('zipService: archive creation', async () => {
    const stageDir = path.join(TEST_DIR, 'stage');
    fs.mkdirSync(stageDir, { recursive: true });
    fs.writeFileSync(path.join(stageDir, 'index.html'), '<h1>Hello</h1>');
    fs.writeFileSync(path.join(stageDir, 'styles.css'), 'h1 { color: red; }');

    const zipOut = path.join(TEST_DIR, 'test.zip');
    const result = await zipDirectory(stageDir, zipOut);

    assert.ok(fs.existsSync(zipOut));
    assert.ok(result.size > 0);
  });
});

