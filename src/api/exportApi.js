export async function triggerExport(albumId) {
  const res = await fetch(`/api/albums/${albumId}/export`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Export failed');
  }
  return res.json();
}

