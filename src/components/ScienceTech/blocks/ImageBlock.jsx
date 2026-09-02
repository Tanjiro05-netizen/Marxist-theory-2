import React, { useState } from 'react';
import { ZoomIn, X } from 'lucide-react';

const ImageBlock = ({ block }) => {
  const [zoomed, setZoomed] = useState(false);

  if (!block.url) return null;

  return (
    <>
      <figure className="my-2">
        <div className="relative group rounded-none overflow-hidden bg-black/30 border border-gray-800 inline-block max-w-full">
          <img
            src={block.url}
            alt={block.alt || block.caption || ''}
            className="max-w-full rounded-none cursor-zoom-in"
            loading="lazy"
            onClick={() => setZoomed(true)}
          />
          <button
            onClick={() => setZoomed(true)}
            className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-none text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        {block.caption && (
          <figcaption className="text-gray-500 text-xs mt-2 text-center italic">
            {block.caption}
          </figcaption>
        )}
      </figure>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomed(false)}
        >
          <button
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={block.url}
            alt={block.alt || block.caption || ''}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-none"
          />
        </div>
      )}
    </>
  );
};

export default ImageBlock;
