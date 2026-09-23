import React, { useState, useRef } from 'react';
import { X, FolderPlus, Upload, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { createAlbum } from '../../api/albumsApi.js';
import { importImages } from '../../api/imagesApi.js';

export default function NewAlbumModal({ isOpen, onClose, onAlbumCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [folderName, setFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepStatus, setStepStatus] = useState('');
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFolderChange = (e) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(
      (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name)
    );

    setSelectedFiles(imageFiles);

    if (files.length > 0) {
      // Determine folder name from webkitRelativePath
      const relativePath = files[0].webkitRelativePath || '';
      const parts = relativePath.split('/');
      if (parts.length > 1) {
        setFolderName(parts[0]);
        if (!name) {
          // auto-fill name from folder name if empty
          setName(parts[0].replace(/[-_]/g, ' '));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a trip name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      setStepStatus('Creating album metadata...');
      const album = await createAlbum({
        name: name.trim(),
        description: description.trim(),
        fromDate: fromDate || null,
        toDate: toDate || null,
      });

      if (selectedFiles.length > 0) {
        setStepStatus(`Importing ${selectedFiles.length} photos & generating thumbnails...`);
        await importImages(album.id, selectedFiles);
      }

      setStepStatus('Done!');
      onAlbumCreated(album);
    } catch (err) {
      console.error('Failed to create album:', err);
      setError(err.message || 'Error creating album');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">Create New Trip Album</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Trip Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer in Tokyo, Swiss Alps"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A few words about this memory..."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 text-stone-700"
              />
            </div>
          </div>

          {/* Folder Selection per Decision D2 & project.md */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">
              Select Photos Folder
            </label>
            <input
              type="file"
              ref={fileInputRef}
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderChange}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                selectedFiles.length > 0
                  ? 'border-amber-500 bg-amber-50/40 text-stone-800'
                  : 'border-stone-200 hover:border-amber-400 hover:bg-stone-50 text-stone-500'
              }`}
            >
              {selectedFiles.length > 0 ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-stone-900">
                      {folderName ? `Folder: ${folderName}` : 'Folder selected'}
                    </p>
                    <p className="text-xs text-amber-700 font-medium">
                      {selectedFiles.length} photo{selectedFiles.length === 1 ? '' : 's'} ready for import
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <Upload className="w-6 h-6 text-stone-400" />
                  <p className="text-xs font-medium text-stone-700">
                    Click to pick a folder of trip photos
                  </p>
                  <span className="text-[10px] text-stone-400">
                    (JPG, PNG, WebP — loaded locally from your disk)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress / Status */}
          {isSubmitting && (
            <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl flex items-center gap-2 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
              <span>{stepStatus}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Album</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

