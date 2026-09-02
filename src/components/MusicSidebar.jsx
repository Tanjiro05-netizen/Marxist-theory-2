import React, { useState } from 'react';
import { Music, X, ChevronLeft } from 'lucide-react';

const MusicSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-green-600 hover:bg-green-700 text-white p-3 rounded-l-lg shadow-none transition-all duration-300 hover:pr-5 group"
          title="Open Music Player"
        >
          <Music className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Sidebar Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        <div className="h-full bg-[#0b0d12] border-l border-gray-800 shadow-none flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold text-sm">Music Player</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          </div>

          {/* Spotify Embed */}
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Spotify</span>
            </div>
            <iframe
              src="https://open.spotify.com/embed/album/1ON6zUsWnFa7nlo5YbDkoD?theme=0"
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="rounded-none"
              title="Spotify Player"
            />

            <p className="text-gray-600 text-xs mt-4 text-center">
              More music services coming soon
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default MusicSidebar;
