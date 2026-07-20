import React, { useEffect, useRef, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const CONSOLE_LINES = [
    { delay: 1200, text: '> boot marxbot v0.0.1-alpha ...' },
    { delay: 2000, text: '> loading corpus: marx, engels, lenin' },
    { delay: 2800, text: '> loading corpus: luxemburg, gramsci       [OK]' },
    { delay: 3600, text: '> connecting language model' },
    { delay: 4400, text: '> building source index — 312 texts mapped' },
    { delay: 5200, text: '> citation engine ready' },
    { delay: 6000, text: '>' },
    { delay: 6800, text: '> STATUS: standby' },
    { delay: 7400, text: '> awaiting input.' },
];

const SUBTITLE_LINES = [
    'Theory assistance system',
    'Search · Read · Understand',
    'Under development',
];

const MarxBotPage = () => {
    const rootRef = useRef(null);
    const gridRef = useRef(null);
    const spotlightRef = useRef(null);
    const mouseRef = useRef({ x: -300, y: -300 });
    const animRef = useRef(null);
    const [visibleLines, setVisibleLines] = useState([]);

    // Generate particles once
    const particles = useMemo(() => {
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            duration: `${8 + Math.random() * 12}s`,
            delay: `${Math.random() * 10}s`,
            drift: `${(Math.random() - 0.5) * 60}px`,
            size: `${1 + Math.random() * 2}px`,
            opacity: 0.2 + Math.random() * 0.4,
        }));
    }, []);

    // Generate neural network nodes once
    const neural = useMemo(() => {
        const nodes = Array.from({ length: 18 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
        }));
        const edges = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                if (Math.sqrt(dx * dx + dy * dy) < 35) {
                    edges.push({ from: i, to: j });
                }
            }
        }
        return { nodes, edges };
    }, []);

    // Mouse tracking for grid + spotlight
    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        const tick = () => {
            const { x, y } = mouseRef.current;
            if (gridRef.current) {
                const cx = window.innerWidth / 2;
                const cy = window.innerHeight / 2;
                gridRef.current.style.setProperty('--grid-x', `${(x - cx) * 0.015}`);
                gridRef.current.style.setProperty('--grid-y', `${(y - cy) * 0.015}`);
            }
            if (spotlightRef.current) {
                spotlightRef.current.style.setProperty('--mx', `${x}px`);
                spotlightRef.current.style.setProperty('--my', `${y}px`);
            }
            animRef.current = requestAnimationFrame(tick);
        };

        window.addEventListener('mousemove', handleMouseMove);
        animRef.current = requestAnimationFrame(tick);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    // Typewriter console reveal
    useEffect(() => {
        const timers = CONSOLE_LINES.map((line, i) =>
            setTimeout(() => {
                setVisibleLines(prev => [...prev, line.text]);
            }, line.delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="marxbot-root" ref={rootRef}>
            {/* Back link */}
            <Link href="/home" className="marxbot-back">
                <ArrowLeft size={14} />
                <span>EXIT</span>
            </Link>

            {/* Layers */}
            <div className="marxbot-scanlines" />
            <div className="marxbot-grid" ref={gridRef} />
            <div className="marxbot-spotlight" ref={spotlightRef} />

            {/* Particles */}
            <div className="marxbot-particles">
                {particles.map(p => (
                    <div
                        key={p.id}
                        className="marxbot-particle"
                        style={{
                            left: p.left,
                            width: p.size,
                            height: p.size,
                            animationDuration: p.duration,
                            animationDelay: p.delay,
                            opacity: p.opacity,
                            '--drift': p.drift,
                        }}
                    />
                ))}
            </div>

            {/* Neural network */}
            <svg className="marxbot-neural" viewBox="0 0 100 100" preserveAspectRatio="none">
                {neural.edges.map((e, i) => (
                    <line
                        key={i}
                        x1={`${neural.nodes[e.from].x}%`}
                        y1={`${neural.nodes[e.from].y}%`}
                        x2={`${neural.nodes[e.to].x}%`}
                        y2={`${neural.nodes[e.to].y}%`}
                    />
                ))}
                {neural.nodes.map((n, i) => (
                    <circle key={i} cx={`${n.x}%`} cy={`${n.y}%`} r="0.4" />
                ))}
            </svg>

            {/* Central content */}
            <div className="marxbot-content">
                {/* Orbit rings */}
                <div className="marxbot-orbit" />
                <div className="marxbot-orbit marxbot-orbit-2" />

                {/* Title */}
                <div className="marxbot-title">
                    <div className="marxbot-title-main">
                        MarxBot<span className="marxbot-tm">TM</span>
                    </div>
                    <div className="marxbot-title-glitch" aria-hidden="true">
                        MarxBot<span className="marxbot-tm">TM</span>
                    </div>
                </div>

                {/* Cryptic subtitle */}
                <div className="marxbot-subtitle">
                    {SUBTITLE_LINES.map((line, i) => (
                        <span
                            key={i}
                            style={{ animationDelay: `${0.6 + i * 0.5}s` }}
                        >
                            {line}
                        </span>
                    ))}
                </div>

                {/* Console block */}
                <div className="marxbot-console">
                    {visibleLines.map((line, i) => (
                        <div
                            key={i}
                            className="marxbot-console-line"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            {line === '>' ? (
                                <span className="marxbot-console-dim">{'>'}</span>
                            ) : (
                                <>
                                    <span className="marxbot-console-prompt">
                                        {line.substring(0, 2)}
                                    </span>
                                    {line.substring(2)}
                                </>
                            )}
                        </div>
                    ))}
                    {visibleLines.length > 0 && (
                        <span className="marxbot-cursor" />
                    )}
                </div>
            </div>

            {/* Status bar */}
            <div className="marxbot-status">
                <div>
                    <span className="marxbot-status-dot" />
                    MARXBOT v0.0.1-alpha &mdash; STANDBY
                </div>
                <div>
                    STATUS: PRE-RELEASE &nbsp;|&nbsp; ACCESS: PUBLIC PREVIEW
                </div>
            </div>
        </div>
    );
};

export default MarxBotPage;
