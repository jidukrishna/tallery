import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DATA_DIR = path.join(PROJECT_ROOT, 'app-data');
const ALBUMS_INDEX_PATH = path.join(DATA_DIR, 'albums.json');
const ALBUMS_DIR = path.join(DATA_DIR, 'albums');

// Ensure base directories exist
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(ALBUMS_DIR)) {
    fs.mkdirSync(ALBUMS_DIR, { recursive: true });
  }
  if (!fs.existsSync(ALBUMS_INDEX_PATH)) {
    fs.writeFileSync(ALBUMS_INDEX_PATH, JSON.stringify({ albums: [] }, null, 2), 'utf-8');
  }
}

export function getAlbumsIndex() {
  ensureDirs();
  try {
    const raw = fs.readFileSync(ALBUMS_INDEX_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading albums index:', err);
    return { albums: [] };
  }
}

export function saveAlbumsIndex(data) {
  ensureDirs();
  fs.writeFileSync(ALBUMS_INDEX_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAlbumPath(albumId) {
  return path.join(ALBUMS_DIR, albumId);
}

export function getAlbum(albumId) {
  ensureDirs();
  const albumJsonPath = path.join(getAlbumPath(albumId), 'album.json');
  if (!fs.existsSync(albumJsonPath)) {
    return null;
  }
  const raw = fs.readFileSync(albumJsonPath, 'utf-8');
  return JSON.parse(raw);
}

export function saveAlbum(albumId, albumData) {
  ensureDirs();
  const folder = getAlbumPath(albumId);
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  const albumJsonPath = path.join(folder, 'album.json');
  fs.writeFileSync(albumJsonPath, JSON.stringify(albumData, null, 2), 'utf-8');

  // Sync index entry
  const index = getAlbumsIndex();
  const idx = index.albums.findIndex((a) => a.id === albumId);
  const now = new Date().toISOString();
  
  // Find cover image thumb if available
  let coverImage = '';
  if (albumData.coverImage) {
    coverImage = albumData.coverImage;
  } else if (albumData.images && albumData.images.length > 0) {
    const firstSelected = albumData.images.find((img) => img.selected) || albumData.images[0];
    coverImage = `/app-data/albums/${albumId}/thumbs/${firstSelected.file}`;
  }

  const summary = {
    id: albumId,
    name: albumData.name || 'Untitled Trip',
    description: albumData.description || '',
    fromDate: albumData.fromDate || '',
    toDate: albumData.toDate || '',
    coverImage,
    createdAt: albumData.createdAt || now,
    updatedAt: now,
    imageCount: albumData.images ? albumData.images.length : 0,
  };

  if (idx >= 0) {
    index.albums[idx] = { ...index.albums[idx], ...summary };
  } else {
    index.albums.unshift(summary);
  }
  saveAlbumsIndex(index);
}

export function createAlbum({ name, description, fromDate, toDate }) {
  ensureDirs();
  const id = `alb_${nanoid(8)}`;
  const albumFolder = getAlbumPath(id);
  
  fs.mkdirSync(path.join(albumFolder, 'source'), { recursive: true });
  fs.mkdirSync(path.join(albumFolder, 'thumbs'), { recursive: true });
  fs.mkdirSync(path.join(albumFolder, 'exports'), { recursive: true });

  const now = new Date().toISOString();
  const newAlbum = {
    id,
    name: name || 'Untitled Trip',
    description: description || '',
    fromDate: fromDate || '',
    toDate: toDate || '',
    images: [],
    templateId: 'template-classic',
    templateOptions: {
      title: name || 'Untitled Trip',
      description: description || '',
      accentColor: '#2b6cb0',
    },
    createdAt: now,
    updatedAt: now,
    lastExportedAt: null,
  };

  saveAlbum(id, newAlbum);
  return newAlbum;
}

export function deleteAlbum(albumId) {
  ensureDirs();
  const folder = getAlbumPath(albumId);
  if (fs.existsSync(folder)) {
    fs.rmSync(folder, { recursive: true, force: true });
  }

  const index = getAlbumsIndex();
  index.albums = index.albums.filter((a) => a.id !== albumId);
  saveAlbumsIndex(index);
}

