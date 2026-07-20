import React, { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 25;

const MaintenancePage = () => {
    const rootRef = useRef(null);
    const revealRef = useRef(null);
    const bgRef = useRef(null);
    const gridRef = useRef(null);
    const echoContainerRef = useRef(null);
    const cursorRef = useRef(null);
    const cursorDotRef = useRef(null);
    const mousePos = useRef({ x: -300, y: -300 });
    const prevMousePos = useRef({ x: -300, y: -300 });
    const animFrameRef = useRef(null);

    useEffect(() => {
        const root = rootRef.current;
        const reveal = revealRef.current;
        const bg = bgRef.current;
        const grid = gridRef.current;
        const echoContainer = echoContainerRef.current;
        const cursor = cursorRef.current;
        const cursorDot = cursorDotRef.current;
        if (!root || !reveal) return;

        let lastEchoTime = 0;

        const handleMouseMove = (e) => {
            prevMousePos.current = { ...mousePos.current };
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const tick = () => {
            const { x, y } = mousePos.current;
            const prev = prevMousePos.current;

            // Update reveal layer
            reveal.style.setProperty('--mouse-x', `${x}px`);
            reveal.style.setProperty('--mouse-y', `${y}px`);

            // Update background mask
            if (bg) {
                bg.style.setProperty('--mouse-x', `${x}px`);
                bg.style.setProperty('--mouse-y', `${y}px`);
            }

            // Update grid parallax
            if (grid) {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                grid.style.setProperty('--grid-x', `${(x - cx) * 0.02}`);
                grid.style.setProperty('--grid-y', `${(y - cy) * 0.02}`);
            }

            // Custom cursor
            if (cursor) {
                cursor.style.left = `${x}px`;
                cursor.style.top = `${y}px`;
            }
            if (cursorDot) {
                cursorDot.style.left = `${x}px`;
                cursorDot.style.top = `${y}px`;
            }

            // Echo on fast movement
            const dx = x - prev.x;
            const dy = y - prev.y;
            const velocity = Math.sqrt(dx * dx + dy * dy);
            const now = Date.now();

            if (velocity > 8 && now - lastEchoTime > 50 && echoContainer) {
                lastEchoTime = now;
                const echo = document.createElement('div');
                echo.className = 'maintenance-echo';
                echo.innerHTML = '<span style="color:#991b1b">Marxist</span><span style="color:#fff">.info</span>';
                echo.style.maskImage = `radial-gradient(circle 180px at ${x}px ${y}px, rgba(0,0,0,0.5) 0%, transparent 70%)`;
                echo.style.webkitMaskImage = echo.style.maskImage;
                echoContainer.appendChild(echo);
                setTimeout(() => {
                    if (echo.parentNode) echo.parentNode.removeChild(echo);
                }, 650);
            }

            animFrameRef.current = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animFrameRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        };
    }, []);

    // Generate particles
    const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const left = Math.random() * 100;
        const duration = 8 + Math.random() * 12;
        const delay = Math.random() * duration;
        const size = 1 + Math.random() * 2;
        const drift = -30 + Math.random() * 60;
        return (
            <div
                key={i}
                className="maintenance-particle"
                style={{
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `-${delay}s`,
                    '--drift': `${drift}px`,
                }}
            />
        );
    });

    return (
        <div className="maintenance-root" ref={rootRef}>
            {/* Custom cursor */}
            <div className="maintenance-cursor" ref={cursorRef} />
            <div className="maintenance-cursor-dot" ref={cursorDotRef} />

            {/* Background layers */}
            <div
                className="maintenance-bg"
                ref={bgRef}
                style={{ backgroundImage: 'url(/marx-background.png)' }}
            />

            {/* Reveal text layer */}
            <div className="maintenance-reveal-layer" ref={revealRef}>
                <span className="maintenance-reveal-red">Marxist</span>
                <span className="maintenance-reveal-white">.info</span>
            </div>
            <div
                ref={echoContainerRef}
                style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}
            />

            {/* Grid */}
            <div className="maintenance-grid" ref={gridRef} />

            {/* Atmospheric layers */}
            <div className="maintenance-vignette" />
            <div className="maintenance-scanlines" />
            <div className="maintenance-glow" />

            {/* Particles */}
            {particles}

            {/* Main content */}
            <div className="maintenance-content">
                <div className="maintenance-glass relative">
                    {/* Title */}
                    <div className="maintenance-title">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-2">
                            <span style={{ color: '#991b1b' }}>Marxist</span>
                            <span style={{ color: '#fff' }}>.info</span>
                        </h1>
                    </div>

                    {/* Divider */}
                    <div
                        className="maintenance-divider mx-auto my-6"
                        style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #991b1b, transparent)' }}
                    />

                    {/* Subtitle */}
                    <div className="maintenance-subtitle">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-200 mb-4 tracking-wide">
                            We Will Be Back Shortly
                        </h2>
                    </div>

                    {/* Message */}
                    <div className="maintenance-message">
                        <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 max-w-md mx-auto">
                            The platform is currently undergoing maintenance and improvements.
                            We are working to bring you a better experience.
                        </p>
                        <p className="text-gray-500 text-xs md:text-sm italic">
                            "The philosophers have only interpreted the world, in various ways.
                            The point, however, is to change it."
                        </p>
                        <p className="text-gray-600 text-xs mt-1">— Karl Marx, Theses on Feuerbach</p>
                    </div>

                    {/* APK Download Button */}
                    <div className="maintenance-download">
                        <a
                            href="https://github.com/Tanjiro05-netizen/MarxistAndroidApp/releases/download/v1.0.0/MarxistForum.apk"
                            download="MarxistForum.apk"
                            className="maintenance-download-link group"
                        >
                            <div className="maintenance-download-aura" />
                            <div className="maintenance-download-btn">
                                <div className="maintenance-download-edge-top" />
                                <div className="maintenance-download-edge-bottom" />
                                <div className="maintenance-download-hover-fill" />
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="22"
                                    height="22"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.75"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="maintenance-download-icon"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" x2="12" y1="15" y2="3" />
                                </svg>
                                <span className="maintenance-download-text">
                                    Download Marxist Forum APK
                                </span>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Footer */}
                <div className="maintenance-footer mt-12 text-center">
                    <p className="text-gray-700 text-xs tracking-widest uppercase">
                        &copy; 2026 Marxist.info &mdash; Advancing Revolutionary Theory
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
