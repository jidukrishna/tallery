import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  XCircle,
  Upload,
  Loader2,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchAlbum, updateAlbum } from '../../api/albumsApi.js';
import { fetchAlbumImages, importImages } from '../../api/imagesApi.js';
import { formatDateRange } from '../../utils/dateUtils.js';
import ImageGrid from './ImageGrid.jsx';

export default function AlbumImageSelect() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [album, setAlbum] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [albumData, imagesData] = await Promise.all([
        fetchAlbum(id),
        fetchAlbumImages(id),
      ]);
      setAlbum(albumData);
      setImages(imagesData || []);
    } catch (err) {
      console.error('Error loading album:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleToggleSelect = (imageId) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const handleSelectAll = () => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: true })));
  };

  const handleDeselectAll = () => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: false })));
  };

  const handleSetCover = async (image) => {
    const coverUrl = `/app-data/albums/${id}/thumbs/${image.file}`;
    setAlbum((prev) => ({ ...prev, coverImage: coverUrl }));
    try {
      await updateAlbum(id, { coverImage: coverUrl });
    } catch (err) {
      console.error('Failed to set cover image:', err);
    }
  };

  const handleImportMore = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setImporting(true);
      const res = await importImages(id, files);
      await loadData();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleContinueToWorkspace = async () => {
    try {
      setSaving(true);
      // Persist selection
      const updatedImages = images.map((img) => ({
        id: img.id,
        file: img.file,
        selected: Boolean(img.selected),
        order: img.order ?? 0,
        edits: img.edits || { crop: { x: 0, y: 0, w: 1, h: 1 }, temperature: 0 },
      }));

      await updateAlbum(id, { images: updatedImages });
      navigate(`/workspace/${id}`);
    } catch (err) {
      alert(`Failed to save selection: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = images.filter((i) => i.selected).length;
  const dateDisplay = album ? formatDateRange(album.fromDate, album.toDate) : '';

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-stone-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
        <p className="text-sm font-medium">Loading photos...</p>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="p-8 max-w-md mx-auto text-center">
        <p className="text-red-600 font-semibold mb-2">Error loading album</p>
        <p className="text-xs text-stone-500 mb-4">{error || 'Album not found'}</p>
        <Link to="/" className="text-sm text-amber-600 underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-6 py-8">
      {/* Sticky Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Navigation and Trip Info */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <span>{album.name}</span>
            </h1>
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                {dateDisplay}
              </span>
              <span>•</span>
              <span className="font-semibold text-amber-600">
                {selectedCount} of {images.length} photos selected
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick actions & continue button */}
        <div className="flex items-center flex-wrap gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            webkitdirectory=""
            directory=""
            onChange={handleImportMore}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {importing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>Add Photos</span>
          </button>

          <button
            onClick={handleSelectAll}
            className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select All</span>
          </button>

          <button
            onClick={handleDeselectAll}
            className="px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Deselect All</span>
          </button>

          <button
            onClick={handleContinueToWorkspace}
            disabled={saving || selectedCount === 0}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid or Empty State */}
      {images.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-stone-300">
          <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No Photos In This Album</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Import a folder of photos to get started with this trip gallery.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-xl hover:bg-amber-600"
          >
            Select Photos Folder
          </button>
        </div>
      ) : (
        <ImageGrid
          images={images}
          coverImage={album.coverImage}
          onToggleSelect={handleToggleSelect}
          onSetCover={handleSetCover}
        />
      )}
    </div>
  );
}

