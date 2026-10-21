import React from 'react';

const ALLOWED_ORIGINS = [
  'desmos.com',
  'geogebra.org',
  'phet.colorado.edu',
  'youtube.com',
  'youtu.be',
  'vimeo.com',
  'wolframalpha.com',
];

const isAllowed = (url) => {
  try {
    const u = new URL(url);
    return ALLOWED_ORIGINS.some(o => u.hostname.endsWith(o));
  } catch {
    return false;
  }
};

const EmbedBlock = ({ block }) => {
  const { url, caption, aspect_ratio = '16/9' } = block;
  if (!url) return null;

  const allowed = isAllowed(url);

  return (
    <div className="my-2">
      {caption && <p className="text-gray-500 text-xs mb-2 italic">{caption}</p>}
      <div className="rounded-none overflow-hidden border border-gray-800 bg-black/20"
        style={{ aspectRatio: aspect_ratio }}>
        {allowed ? (
          <iframe
            src={url}
            title={caption || 'Embedded content'}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/40">
            <div className="text-center">
              <p className="text-gray-400 text-sm">External embed</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 text-sm underline"
              >
                Open in new tab →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbedBlock;
