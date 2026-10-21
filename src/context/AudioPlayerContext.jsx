import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const AudioPlayerContext = createContext();

export const AudioPlayerProvider = ({ children }) => {
    const [currentBook, setCurrentBook] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const audioRef = useRef(null);
    const ctxRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);

    const initAudio = useCallback(() => {
        if (!audioRef.current || sourceRef.current) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.82;
            const source = ctx.createMediaElementSource(audioRef.current);
            source.connect(analyser);
            analyser.connect(ctx.destination);
            ctxRef.current = ctx;
            analyserRef.current = analyser;
            sourceRef.current = source;
        } catch (e) {
            console.warn('AudioContext init failed:', e);
        }
    }, []);

    const setupMediaSession = useCallback((bookInfo) => {
        if (!('mediaSession' in navigator) || !bookInfo) return;
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: bookInfo.title || 'Audiobook',
            artist: bookInfo.author || 'Marxist.info',
            album: 'Marxist.info Audiobooks',
            artwork: bookInfo.cover_url
                ? [
                    { src: bookInfo.cover_url, sizes: '96x96', type: 'image/jpeg' },
                    { src: bookInfo.cover_url, sizes: '256x256', type: 'image/jpeg' },
                    { src: bookInfo.cover_url, sizes: '512x512', type: 'image/jpeg' },
                ]
                : [],
        });

        navigator.mediaSession.setActionHandler('play', () => {
            if (audioRef.current) { initAudio(); audioRef.current.play().catch(() => {}); }
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            if (audioRef.current) audioRef.current.pause();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
            if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
            if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10);
        });

        const chapters = bookInfo.chapters || [];
        if (chapters.length > 1) {
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                if (!audioRef.current) return;
                const cur = audioRef.current.currentTime;
                for (let i = chapters.length - 1; i >= 0; i--) {
                    if ((chapters[i].start_seconds || 0) < cur - 2) {
                        audioRef.current.currentTime = chapters[i].start_seconds || 0;
                        return;
                    }
                }
                audioRef.current.currentTime = 0;
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                if (!audioRef.current) return;
                const cur = audioRef.current.currentTime;
                for (let i = 0; i < chapters.length; i++) {
                    if ((chapters[i].start_seconds || 0) > cur + 1) {
                        audioRef.current.currentTime = chapters[i].start_seconds || 0;
                        return;
                    }
                }
            });
        }
    }, [initAudio]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
        }
    }, [isPlaying]);

    useEffect(() => {
        if (currentBook) {
            // Auto play when book changes
            setTimeout(() => {
                if (audioRef.current) {
                    initAudio();
                    audioRef.current.play().catch(() => {});
                    setupMediaSession(currentBook);
                }
            }, 150);
        }
    }, [currentBook, initAudio, setupMediaSession]);

    const playAudiobook = (book) => {
        setCurrentBook(book);
        setIsExpanded(false); // Pop up mini-player first
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            initAudio();
            audioRef.current.play().catch(() => {});
        }
    };

    const seekTo = (time) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
    };

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setIsPlaying(false);
        setCurrentBook(null);
        setIsExpanded(false);
        
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
        }
    };

    return (
        <AudioPlayerContext.Provider value={{
            currentBook, isPlaying, progress, duration, isExpanded,
            playAudiobook, togglePlay, seekTo, closePlayer, setIsExpanded,
            initAudio, analyserRef, audioRef
        }}>
            {children}
            
            {currentBook && (
                <audio
                    ref={audioRef}
                    src={currentBook.audio_url}
                    onTimeUpdate={(e) => {
                        setProgress(e.target.currentTime);
                        if ('mediaSession' in navigator && e.target.duration && isFinite(e.target.duration)) {
                            try { navigator.mediaSession.setPositionState({ duration: e.target.duration, playbackRate: e.target.playbackRate, position: e.target.currentTime }); } catch {}
                        }
                    }}
                    onLoadedMetadata={(e) => setDuration(e.target.duration)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                    crossOrigin="anonymous"
                    className="hidden"
                />
            )}
        </AudioPlayerContext.Provider>
    );
};

export const useAudioPlayer = () => useContext(AudioPlayerContext);
