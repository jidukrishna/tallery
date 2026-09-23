import fs from 'fs';
import path from 'path';

/**
 * Helper to format date range string e.g. "Jan 10 – Jan 13, 2026"
 */
export function formatDateRange(fromDate, toDate) {
  if (!fromDate && !toDate) return '';
  
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  
  if (fromDate && !toDate) {
    try {
      const d = new Date(fromDate);
      return isNaN(d.getTime()) ? fromDate : d.toLocaleDateString('en-US', options);
    } catch {
      return fromDate;
    }
  }

  if (!fromDate && toDate) {
    try {
      const d = new Date(toDate);
      return isNaN(d.getTime()) ? toDate : d.toLocaleDateString('en-US', options);
    } catch {
      return toDate;
    }
  }

  try {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      return `${fromDate} – ${toDate}`;
    }

    const y1 = d1.getFullYear();
    const y2 = d2.getFullYear();
    const m1 = d1.toLocaleDateString('en-US', { month: 'short' });
    const m2 = d2.toLocaleDateString('en-US', { month: 'short' });
    const day1 = d1.getDate();
    const day2 = d2.getDate();

    if (y1 === y2 && m1 === m2) {
      return `${m1} ${day1} – ${day2}, ${y1}`;
    }
    if (y1 === y2) {
      return `${m1} ${day1} – ${m2} ${day2}, ${y1}`;
    }
    return `${m1} ${day1}, ${y1} – ${m2} ${day2}, ${y2}`;
  } catch {
    return `${fromDate} – ${toDate}`;
  }
}

/**
 * Render template HTML with album data
 * @param {string} templateDir - directory containing index.html and styles.css
 * @param {object} album - album data object
 * @param {object} options - { isPreview: boolean }
 */
export function renderTemplate(templateDir, album, options = { isPreview: false }) {
  const indexHtmlPath = path.join(templateDir, 'index.html');
  const stylesCssPath = path.join(templateDir, 'styles.css');

  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`Template index.html not found in ${templateDir}`);
  }

  let html = fs.readFileSync(indexHtmlPath, 'utf-8');

  // Values
  const title = (album.templateOptions && album.templateOptions.title) || album.name || 'Untitled Trip';
  const description = (album.templateOptions && album.templateOptions.description) || album.description || '';
  const dateRange = formatDateRange(album.fromDate, album.toDate);
  const accentColor = (album.templateOptions && album.templateOptions.accentColor) || '#2b6cb0';

  // Handle CSS for preview
  if (options.isPreview && fs.existsSync(stylesCssPath)) {
    const stylesCss = fs.readFileSync(stylesCssPath, 'utf-8');
    // Replace <link rel="stylesheet" href="styles.css" /> or inject into <head>
    if (html.includes('href="styles.css"')) {
      html = html.replace(/<link[^>]+href=["']styles\.css["'][^>]*>/i, `<style>${stylesCss}</style>`);
    } else {
      html = html.replace('</head>', `<style>${stylesCss}</style></head>`);
    }
  }

  // Replace global tokens
  html = html.replaceAll('{{TITLE}}', title);
  html = html.replaceAll('{{DESCRIPTION}}', description);
  html = html.replaceAll('{{DATE_RANGE}}', dateRange);
  html = html.replaceAll('{{ACCENT_COLOR}}', accentColor);

  // Gallery Loop Block
  const loopRegex = /<!--GALLERY_ITEM_START-->([\s\S]*?)<!--GALLERY_ITEM_END-->/;
  const match = html.match(loopRegex);

  if (match) {
    const itemTemplate = match[1];
    const selectedImages = (album.images || [])
      .filter((img) => img.selected)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const renderedItems = selectedImages.map((img, index) => {
      let itemHtml = itemTemplate;
      const imgIndex = index + 1;
      const imgAlt = `${title} photo ${imgIndex}`;

      // In preview mode, use the thumb path from backend
      // In export mode, use relative assets/img.file
      let imageSrc = `assets/${img.file}`;
      if (options.isPreview) {
        imageSrc = `/app-data/albums/${album.id}/thumbs/${img.file}`;
      }

      // Replace item tokens
      // Note: the template contains "assets/{{IMAGE_FILE}}" so in preview we want to handle that
      if (options.isPreview) {
        itemHtml = itemHtml.replaceAll('assets/{{IMAGE_FILE}}', imageSrc);
      }
      itemHtml = itemHtml.replaceAll('{{IMAGE_FILE}}', img.file);
      itemHtml = itemHtml.replaceAll('{{IMAGE_ALT}}', imgAlt);
      itemHtml = itemHtml.replaceAll('{{IMAGE_INDEX}}', String(imgIndex));
      return itemHtml;
    }).join('\n');

    html = html.replace(loopRegex, renderedItems);
  }

  return html;
}

