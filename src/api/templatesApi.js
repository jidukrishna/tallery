export async function fetchTemplates() {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function uploadTemplate(file) {
  const formData = new FormData();
  formData.append('templateZip', file);

  const res = await fetch('/api/templates', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to upload template');
  }
  return res.json();
}

export async function fetchPreviewHtml(albumId) {
  const res = await fetch(`/api/albums/${albumId}/preview`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to render template preview');
  return res.text();
}

