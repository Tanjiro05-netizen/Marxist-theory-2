import React from 'react';
import { useAudioPlayer } from '../../context/AudioPlayerContext';
import { Play, Pause, X, Headphones, Maximize2 } from 'lucide-react';
import AudiobookPlayer from './AudiobookPlayer';

const FloatingMiniPlayer = () => {
    const { currentBook, isPlaying, progress, duration, isExpanded, togglePlay, closePlayer, setIsExpanded } = useAudioPlayer();

    if (!currentBook) return null;

    // Full screen mode
    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
                <div className="w-full max-w-4xl max-h-screen overflow-y-auto bg-[#0b0d12] rounded-none border border-gray-800 shadow-none relative">
                    <AudiobookPlayer book={currentBook} onClose={() => setIsExpanded(false)} />
                </div>
            </div>
        );
    }

    // Mini Player Mode
    const formatTime = (secs) => {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration ? (progress / duration) * 100 : 0;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-black/80 backdrop-blur-lg border border-gray-800 rounded-none shadow-none z-[90] overflow-hidden flex flex-col group">
            {/* Progress Bar Top Edge */}
            <div className="h-1 w-full bg-gray-900">
                <div 
                    className="h-full bg-red-600 transition-all duration-300 ease-linear" 
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            
            <div className="flex items-center p-3 gap-3">
                {/* Cover Art Thumbnail */}
                <div 
                    className="w-12 h-12 bg-gray-900 rounded-none overflow-hidden flex-shrink-0 relative cursor-pointer"
                    onClick={() => setIsExpanded(true)}
                >
                    {currentBook.cover_url ? (
                        <img src={currentBook.cover_url} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Headphones size={20} className="text-gray-600" />
                        </div>
                    )}
                    {/* Expand icon on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Maximize2 size={16} className="text-white" />
                    </div>
                </div>

                {/* Track Info */}
                <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setIsExpanded(true)}
                >
                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                        {currentBook.title}
                    </h4>
                    <p className="text-xs text-gray-400 truncate">
                        {currentBook.author || 'Unknown Author'} • {formatTime(progress)} / {formatTime(duration)}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 flex-shrink-0 pr-1">
                    <button 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-transform active:scale-95"
                    >
                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); closePlayer(); }}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FloatingMiniPlayer;
