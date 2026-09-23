export async function importImages(albumId, files) {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    // Only upload image types
    if (files[i].type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(files[i].name)) {
      formData.append('images', files[i]);
    }
  }

  const res = await fetch(`/api/albums/${albumId}/images/import`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to import images');
  }
  return res.json();
}

export async function fetchAlbumImages(albumId) {
  const res = await fetch(`/api/albums/${albumId}/images`);
  if (!res.ok) throw new Error('Failed to fetch album images');
  return res.json();
}

export async function updateImageEdit(albumId, imageId, edits) {
  const res = await fetch(`/api/albums/${albumId}/images/${imageId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edits }),
  });
  if (!res.ok) throw new Error('Failed to update image edits');
  return res.json();
}

