import React from 'react';
import { Play } from 'lucide-react';

const VideoBlock = ({ block }) => {
  if (!block.url) return null;

  const youtubeMatch = block.url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );

  const renderYouTube = (videoId) => {
    let src = `https://www.youtube.com/embed/${videoId}?rel=0`;
    if (block.start != null) src += `&start=${Math.floor(block.start)}`;
    if (block.end != null) src += `&end=${Math.floor(block.end)}`;

    return (
      <iframe
        src={src}
        title={block.caption || 'Video'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    );
  };

  const renderHosted = () => (
    <video
      src={block.url}
      controls
      className="w-full h-full"
      preload="metadata"
    >
      Your browser does not support the video tag.
    </video>
  );

  return (
    <div className="my-2">
      <div className="bg-black/40 rounded-xl overflow-hidden border border-gray-800">
        {block.caption && (
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Play className="w-4 h-4 text-red-400" />
            <span className="text-white text-sm font-medium">{block.caption}</span>
          </div>
        )}
        <div className="aspect-video bg-black">
          {youtubeMatch ? renderYouTube(youtubeMatch[1]) : renderHosted()}
        </div>
      </div>
    </div>
  );
};

export default VideoBlock;
