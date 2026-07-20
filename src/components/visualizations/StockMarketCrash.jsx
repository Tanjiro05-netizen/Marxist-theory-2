import React, { useEffect, useState } from 'react';

const StockMarketCrash = ({ show = true }) => {
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (show) {
            setKey(prev => prev + 1);
        }
    }, [show]);

    return show ? (
        <div className="absolute inset-0 overflow-hidden">
            <div className="stock-chart">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={`${key}-${i}`} 
                        className="chart-line" 
                        style={{ animationDelay: `${i * 0.1}s` }} 
                    />
                ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#12131A] via-[#12131A]/70 to-transparent" />
        </div>
    ) : null;
};

export default StockMarketCrash;
