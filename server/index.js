import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import albumsRouter from './routes/albums.routes.js';
import imagesRouter from './routes/images.routes.js';
import templatesRouter from './routes/templates.routes.js';
import exportRouter from './routes/export.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file hosting for runtime data & templates
const APP_DATA_DIR = path.join(PROJECT_ROOT, 'app-data');
if (!fs.existsSync(APP_DATA_DIR)) {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}
app.use('/app-data', express.static(APP_DATA_DIR));

const TEMPLATES_DIR = path.join(PROJECT_ROOT, 'templates');
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}
app.use('/templates', express.static(TEMPLATES_DIR));

// API Routes
app.use('/api/albums/:id/images', imagesRouter);
app.use('/api/albums/:id/export', exportRouter);
app.use('/api/albums/:id/exports', exportRouter);
app.use('/api/albums', albumsRouter);
app.use('/api/templates', templatesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Production: serve built frontend
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`[TripGallery Server] Running on http://localhost:${PORT}`);
});
