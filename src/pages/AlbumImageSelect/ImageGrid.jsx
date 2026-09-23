import React from 'react';
import ImageThumb from './ImageThumb.jsx';

export default function ImageGrid({
  images,
  coverImage,
  onToggleSelect,
  onSetCover,
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {images.map((image) => {
        const isCover = coverImage && coverImage.includes(image.file);
        return (
          <ImageThumb
            key={image.id}
            image={image}
            isCover={Boolean(isCover)}
            onToggleSelect={onToggleSelect}
            onSetCover={onSetCover}
          />
        );
      })}
    </div>
  );
}

