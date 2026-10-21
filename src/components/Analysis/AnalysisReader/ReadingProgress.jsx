import React, { useState, useEffect } from 'react';

const ReadingProgress = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const calculateProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrollTop = window.scrollY;
            const currentProgress = documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;
            setProgress(Math.min(100, Math.max(0, currentProgress)));
        };

        calculateProgress();
        window.addEventListener('scroll', calculateProgress, { passive: true });
        window.addEventListener('resize', calculateProgress, { passive: true });

        return () => {
            window.removeEventListener('scroll', calculateProgress);
            window.removeEventListener('resize', calculateProgress);
        };
    }, []);

    return (
        <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-gray-800">
            <div
                className="h-full bg-[#10131b] from-red-600 to-red-400 transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

export default ReadingProgress;
