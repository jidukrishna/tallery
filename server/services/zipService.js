import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

/**
 * Creates a zip archive from a directory
 * @param {string} sourceDir - Folder to zip
 * @param {string} outPath - Destination .zip file
 */
export function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Maximum compression
    });

    output.on('close', () => {
      resolve({
        path: outPath,
        size: archive.pointer(),
      });
    });

    output.on('error', (err) => {
      reject(err);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    // Append all contents of sourceDir to the root of the zip archive
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

