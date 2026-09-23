import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Image as ImageIcon, Trash2, ArrowRight } from 'lucide-react';
import { formatDateRange } from '../../utils/dateUtils.js';

export default function AlbumCard({ album, onDelete }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/album/${album.id}`);
  };

  const dateDisplay = album.fromDate || album.toDate
    ? formatDateRange(album.fromDate, album.toDate)
    : 'No dates set';

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-stone-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Cover Image or Postcard Header */}
      <div className="relative h-48 bg-stone-100 overflow-hidden border-b border-stone-100">
        {album.coverImage ? (
          <img
            src={album.coverImage}
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-400 bg-linear-to-br from-stone-100 to-stone-200">
            <ImageIcon className="w-12 h-12 stroke-[1.5] mb-2 text-stone-300" />
            <span className="text-xs font-medium">No photos yet</span>
          </div>
        )}

        {/* Postcard stamp / Date badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-stone-700 shadow-xs flex items-center gap-1.5 border border-white/50">
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>{dateDisplay}</span>
        </div>

        {/* Image count badge */}
        <div className="absolute bottom-3 left-3 bg-stone-900/75 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{album.imageCount || 0} photos</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-1">
            {album.name}
          </h3>
          {album.description && (
            <p className="mt-1 text-sm text-stone-500 line-clamp-2 leading-relaxed">
              {album.description}
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(album.id, album.name);
            }}
            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete album"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-amber-600 group-hover:text-amber-700 flex items-center gap-1">
            Select Photos <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
