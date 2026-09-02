import React, { useEffect } from 'react';

const SpotifyEmbed = () => {
    useEffect(() => {
        window.onSpotifyIframeApiReady = (IFrameAPI) => {
            const element = document.getElementById('embed-iframe');
            const options = {
                uri: 'spotify:album:1ON6zUsWnFa7nlo5YbDkoD',
                width: '100%',
                height: '80',  // Reduced height
                theme: '0',
                allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
                loading: 'lazy'
            };
            const callback = (EmbedController) => {
                // Enable playback control
                EmbedController.addListener('playback_update', e => {
                    console.log('Now playing:', e);
                });
            };
            IFrameAPI.createController(element, options, callback);
        };

        // Add permissions to the script
        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        script.setAttribute('allow', 'encrypted-media; autoplay');
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
            window.onSpotifyIframeApiReady = null;
        };
    }, []);

    return (
        <div className="w-full bg-[#10131b] from-black to-black/95 backdrop-blur-md border border-red-500/20 rounded-none overflow-hidden">
            <div className="w-full">
                <div 
                    id="embed-iframe" 
                    className="transform translate-y-[-2px]"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                />
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(#ff000022_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
        </div>
    );
};

export default SpotifyEmbed;