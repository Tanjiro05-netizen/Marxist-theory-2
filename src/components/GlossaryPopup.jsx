import React from 'react';
import { X, ExternalLink } from 'lucide-react';

const GlossaryPopup = ({ term, onClose }) => {
    if (!term) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
            onClick={onClose}
        >
            <div 
                className="bg-gray-900 border border-red-500/30 rounded-none shadow-none w-full max-w-2xl m-4 relative p-8 transform transition-all duration-300 ease-out scale-95 animate-scaleIn"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>
                <h2 className="text-3xl font-bold text-red-400 mb-4">{term.term}</h2>
                <p className="text-gray-300 leading-relaxed">{term.explanation}</p>
                {term.url && (
                    <a
                        href={term.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 hover:text-red-300 transition-colors duration-200 mt-6 inline-flex items-center font-semibold"
                    >
                        Read More <ExternalLink className="ml-2" size={16} />
                    </a>
                )}
            </div>
        </div>
    );
};

export default GlossaryPopup;
