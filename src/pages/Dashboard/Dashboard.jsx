import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Compass, MapPin, Loader2, Sparkles } from 'lucide-react';
import { fetchAlbums, deleteAlbum } from '../../api/albumsApi.js';
import AlbumCard from './AlbumCard.jsx';
import NewAlbumModal from './NewAlbumModal.jsx';
import { APP_NAME } from '../../constants/app.js';

export default function Dashboard() {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAlbums();
      setAlbums(data || []);
    } catch (err) {
      console.error('Failed to load albums:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const handleDeleteAlbum = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the trip album "${name}"? This cannot be undone.`)) {
      try {
        await deleteAlbum(id);
        setAlbums((prev) => prev.filter((a) => a.id !== id));
      } catch (err) {
        alert(`Failed to delete album: ${err.message}`);
      }
    }
  };

  const handleAlbumCreated = (newAlbum) => {
    setIsModalOpen(false);
    navigate(`/album/${newAlbum.id}`);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
            <Compass className="w-4 h-4" />
            <span>Personal Travel Memories</span>
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Trip Albums
          </h1>
          <p className="mt-1 text-sm text-stone-500 max-w-lg">
            Turn your folders of vacation and adventure photos into beautiful, standalone offline galleries.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Album</span>
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-stone-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
          <p className="text-sm font-medium">Loading albums...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 max-w-lg mx-auto text-center">
          <p className="font-semibold text-sm">Failed to load albums</p>
          <p className="text-xs mt-1 text-red-500">{error}</p>
          <button
            onClick={loadAlbums}
            className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : albums.length === 0 ? (
        <div className="py-20 px-6 max-w-lg mx-auto text-center bg-white rounded-3xl border border-dashed border-stone-300 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">No Trip Albums Yet</h2>
          <p className="mt-2 text-sm text-stone-500 leading-relaxed">
            Create your first album by selecting a folder of photos from your latest trip.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create First Album</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onDelete={handleDeleteAlbum}
            />
          ))}
        </div>
      )}

      {/* New Album Modal */}
      <NewAlbumModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAlbumCreated={handleAlbumCreated}
      />
    </div>
  );
}

