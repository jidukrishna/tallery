import React from 'react';
import { Check, Star } from 'lucide-react';

export default function ImageThumb({
  image,
  isCover,
  onToggleSelect,
  onSetCover,
}) {
  return (
    <div
      onClick={() => onToggleSelect(image.id)}
      className={`group relative rounded-xl overflow-hidden aspect-square cursor-pointer transition-all duration-200 border-2 select-none ${
        image.selected
          ? 'border-amber-500 shadow-md ring-2 ring-amber-500/20'
          : 'border-stone-200 hover:border-stone-300 opacity-60 hover:opacity-90'
      }`}
    >
      <img
        src={image.thumbUrl}
        alt={image.originalName || image.file}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Selection Checkbox */}
      <div
        className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-xs ${
          image.selected
            ? 'bg-amber-500 text-white'
            : 'bg-stone-900/40 text-white/50 group-hover:bg-stone-900/60'
        }`}
      >
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </div>

      {/* Cover image indicator / button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetCover(image);
        }}
        className={`absolute bottom-2.5 left-2.5 p-1.5 rounded-lg transition-all text-xs flex items-center gap-1 ${
          isCover
            ? 'bg-amber-500 text-white shadow-xs'
            : 'bg-stone-900/50 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-stone-900/80'
        }`}
        title={isCover ? 'Current Cover Image' : 'Set as Album Cover'}
      >
        <Star className={`w-3.5 h-3.5 ${isCover ? 'fill-current' : ''}`} />
        {isCover && <span className="text-[10px] font-semibold pr-0.5">Cover</span>}
      </button>

      {/* Hover overlay hint */}
      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
    </div>
  );
}

