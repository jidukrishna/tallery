export async function fetchAlbums() {
  const res = await fetch('/api/albums');
  if (!res.ok) throw new Error('Failed to fetch albums');
  return res.json();
}

export async function fetchAlbum(id) {
  const res = await fetch(`/api/albums/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch album ${id}`);
  return res.json();
}

export async function createAlbum(data) {
  const res = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create album');
  return res.json();
}

export async function updateAlbum(id, updates) {
  const res = await fetch(`/api/albums/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update album');
  return res.json();
}

export async function deleteAlbum(id) {
  const res = await fetch(`/api/albums/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete album');
  return res.json();
}

