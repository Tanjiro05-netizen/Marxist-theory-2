import React from 'react';

const HighlightsSidebar = ({ highlights, onDelete, onDeleteHighlight }) => {
    const handleDelete = onDeleteHighlight || onDelete;
    return (
        <div className="">
            <div className="bg-gray-900/50 backdrop-blur-sm p-4 rounded-none border border-gray-700/50">
                <h3 className="text-xl font-semibold text-white mb-4">Your Highlights</h3>
                {highlights.length === 0 ? (
                    <p className="text-gray-400">Select text in the article to create a highlight.</p>
                ) : (
                    <ul className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {highlights.map(highlight => (
                            <li key={highlight.id} className="border-b border-gray-700 pb-3 last:border-b-0">
                                <p className="text-gray-300 italic">"{highlight.selected_text}"</p>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={() => handleDelete?.(highlight.id)}
                                        className="text-xs text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default HighlightsSidebar;
