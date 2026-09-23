import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

/**
 * Generate a fast thumbnail (~400px max dimension)
 */
export async function generateThumbnail(sourcePath, thumbPath) {
  const dir = path.dirname(thumbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await sharp(sourcePath)
    .rotate() // auto-orient based on EXIF
    .resize(400, 400, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(thumbPath);
}

/**
 * Process image with non-destructive edits for export or high-res preview
 * @param {string} sourcePath - original image file
 * @param {string} outputPath - destination output file
 * @param {object} edits - { crop: {x, y, w, h}, temperature: number (-50..50) }
 */
export async function processImageForExport(sourcePath, outputPath, edits = {}) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let pipeline = sharp(sourcePath).rotate();
  const metadata = await pipeline.metadata();
  const origW = metadata.width;
  const origH = metadata.height;

  // Apply crop if provided and not full image
  if (edits && edits.crop) {
    const { x, y, w, h } = edits.crop;
    if (w > 0 && h > 0 && (x > 0 || y > 0 || w < 0.999 || h < 0.999)) {
      // Coordinates normalized 0..1
      const left = Math.max(0, Math.min(origW - 1, Math.round(x * origW)));
      const top = Math.max(0, Math.min(origH - 1, Math.round(y * origH)));
      const width = Math.max(1, Math.min(origW - left, Math.round(w * origW)));
      const height = Math.max(1, Math.min(origH - top, Math.round(h * origH)));

      pipeline = pipeline.extract({ left, top, width, height });
    }
  }

  // Apply temperature (-50 to +50)
  if (edits && typeof edits.temperature === 'number' && edits.temperature !== 0) {
    const temp = Math.max(-50, Math.min(50, edits.temperature));
    // Factor: -50 -> cool (increase blue, decrease red)
    //         +50 -> warm (increase red, decrease blue)
    const shift = (temp / 50) * 0.25; // up to +/- 25%
    const rScale = Math.max(0.7, Math.min(1.3, 1 + shift));
    const bScale = Math.max(0.7, Math.min(1.3, 1 - shift));
    
    pipeline = pipeline.recomb([
      [rScale, 0, 0],
      [0, 1, 0],
      [0, 0, bScale],
    ]);
  }

  // Optimize and save
  await pipeline
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(outputPath);
}

