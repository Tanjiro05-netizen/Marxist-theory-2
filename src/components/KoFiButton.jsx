import React from 'react';

const KoFiButton = ({ 
    text = 'Support me on Ko-fi', 
    color = '#a61b1b', 
    id = 'Z8Z31TQLEW' 
}) => {
    return (
        <div className="kofi-btn-container">
            <a 
                title={text}
                className="kofi-button" 
                style={{ backgroundColor: color }} 
                href={`https://ko-fi.com/${id}`} 
                target="_blank" 
                rel="noopener noreferrer"
            > 
                <span className="kofi-text">
                    <img 
                        src="https://storage.ko-fi.com/cdn/cup-border.png" 
                        alt="Ko-fi donations" 
                        className="kofi-img" 
                    />
                    {text}
                </span>
            </a>
        </div>
    );
};

export default KoFiButton;
