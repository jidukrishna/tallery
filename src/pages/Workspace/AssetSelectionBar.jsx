import React from 'react';
import { useAlbumWorkspace } from '../../context/AlbumWorkspaceContext.jsx';
import { ChevronLeft, ChevronRight, X, Film, Sparkles } from 'lucide-react';

export default function AssetSelectionBar() {
  const {
    images,
    focusedImageId,
    setFocusedImageId,
    reorderImages,
    toggleImageSelection,
  } = useAlbumWorkspace();

  const selectedImages = images
    .filter((img) => img.selected)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const handleMove = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= selectedImages.length) return;

    const reordered = [...selectedImages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Combine with unselected images
    const unselected = images.filter((img) => !img.selected);
    reorderImages([...reordered, ...unselected]);
  };

  return (
    <div className="h-28 bg-white border-t border-stone-200 flex flex-col shrink-0">
      {/* Mini Bar Header */}
      <div className="px-4 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[11px] font-medium text-stone-500">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-stone-600">
          <Film className="w-3.5 h-3.5 text-amber-600" />
          <span>Selected Photos ({selectedImages.length})</span>
        </div>
        <div className="text-[10px] text-stone-400">
          Click to edit photo • Use arrows to reorder gallery sequence
        </div>
      </div>

      {/* Filmstrip */}
      <div className="flex-1 overflow-x-auto flex items-center gap-3 px-4 py-2 scrollbar-thin">
        {selectedImages.length === 0 ? (
          <div className="text-xs text-stone-400 italic">
            No photos selected for this gallery. Select photos to appear in the gallery.
          </div>
        ) : (
          selectedImages.map((img, index) => {
            const isFocused = img.id === focusedImageId;
            return (
              <div
                key={img.id}
                onClick={() => setFocusedImageId(img.id)}
                className={`group relative h-20 aspect-square rounded-xl overflow-hidden cursor-pointer shrink-0 border-2 transition-all select-none ${
                  isFocused
                    ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-md scale-105'
                    : 'border-stone-200 hover:border-stone-400 opacity-85 hover:opacity-100'
                }`}
              >
                <img
                  src={img.thumbUrl}
                  alt={img.originalName || img.file}
                  className="w-full h-full object-cover"
                />

                {/* Index badge */}
                <div className="absolute top-1 left-1 bg-stone-900/80 text-white rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold">
                  {index + 1}
                </div>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(img.id);
                  }}
                  className="absolute top-1 right-1 bg-stone-900/70 hover:bg-red-600 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove from gallery"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Reorder Arrows on hover */}
                <div className="absolute bottom-1 inset-x-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(index, -1);
                    }}
                    className="p-0.5 rounded bg-stone-900/80 text-white hover:bg-amber-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Move left"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    disabled={index === selectedImages.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(index, 1);
                    }}
                    className="p-0.5 rounded bg-stone-900/80 text-white hover:bg-amber-600 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                    title="Move right"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

