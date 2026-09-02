import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Highlighter, MessageSquare, Search, X } from 'lucide-react';

const HIGHLIGHT_COLORS = [
    { name: 'yellow', class: 'bg-yellow-500/30', border: 'border-yellow-500' },
    { name: 'red', class: 'bg-red-500/30', border: 'border-red-500' },
    { name: 'green', class: 'bg-green-500/30', border: 'border-green-500' },
    { name: 'blue', class: 'bg-blue-500/30', border: 'border-blue-500' },
    { name: 'purple', class: 'bg-purple-500/30', border: 'border-purple-500' },
];

const TextSelectionPopup = ({ 
    containerRef,
    onHighlight,
    onComment,
    onAnalyze,
    currentSectionId,
}) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [selectedText, setSelectedText] = useState('');
    const [selectionRange, setSelectionRange] = useState(null);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showCommentInput, setShowCommentInput] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [highlightNote, setHighlightNote] = useState('');
    const popupRef = useRef(null);

    const handleSelection = useCallback(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (!text || text.length < 3) {
            setVisible(false);
            setShowColorPicker(false);
            setShowCommentInput(false);
            return;
        }

        // Check if selection is within our container
        if (containerRef?.current && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = containerRef.current;
            
            if (!container.contains(range.commonAncestorContainer)) {
                setVisible(false);
                return;
            }

            // Get position for popup
            const rect = range.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            setPosition({
                x: rect.left + rect.width / 2 - containerRect.left,
                y: rect.top - containerRect.top - 10,
            });
            
            setSelectedText(text);
            setSelectionRange(range.cloneRange());
            setVisible(true);
        }
    }, [containerRef]);

    useEffect(() => {
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', handleSelection);

        return () => {
            document.removeEventListener('mouseup', handleSelection);
            document.removeEventListener('keyup', handleSelection);
        };
    }, [handleSelection]);

    // Close popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popupRef.current && !popupRef.current.contains(e.target)) {
                // Small delay to allow button clicks to register
                setTimeout(() => {
                    const selection = window.getSelection();
                    if (!selection?.toString().trim()) {
                        setVisible(false);
                        setShowColorPicker(false);
                        setShowCommentInput(false);
                    }
                }, 100);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleHighlight = (color) => {
        if (onHighlight && selectedText && currentSectionId) {
            onHighlight({
                sectionId: currentSectionId,
                text: selectedText,
                color,
                note: highlightNote,
                range: selectionRange ? {
                    startOffset: selectionRange.startOffset,
                    endOffset: selectionRange.endOffset,
                } : null,
            });
        }
        setVisible(false);
        setShowColorPicker(false);
        setHighlightNote('');
        window.getSelection()?.removeAllRanges();
    };

    const handleComment = () => {
        if (onComment && commentText.trim() && currentSectionId) {
            onComment({
                sectionId: currentSectionId,
                text: selectedText,
                comment: commentText,
            });
        }
        setVisible(false);
        setShowCommentInput(false);
        setCommentText('');
        window.getSelection()?.removeAllRanges();
    };

    const handleAnalyze = () => {
        if (onAnalyze && selectedText) {
            onAnalyze(selectedText);
        }
        setVisible(false);
        window.getSelection()?.removeAllRanges();
    };

    const closePopup = () => {
        setVisible(false);
        setShowColorPicker(false);
        setShowCommentInput(false);
        window.getSelection()?.removeAllRanges();
    };

    if (!visible) return null;

    return (
        <div
            ref={popupRef}
            className="absolute z-50 transform -translate-x-1/2 -translate-y-full"
            style={{ left: position.x, top: position.y }}
        >
            <div className="bg-gray-900 border border-gray-700 rounded-none shadow-none overflow-hidden">
                {/* Main Actions */}
                {!showColorPicker && !showCommentInput && (
                    <div className="flex items-center gap-1 p-1">
                        <button
                            onClick={() => setShowColorPicker(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white hover:bg-yellow-500/20 rounded transition-colors"
                            title="Highlight"
                        >
                            <Highlighter size={16} className="text-yellow-400" />
                            <span>Highlight</span>
                        </button>
                        <div className="w-px h-6 bg-gray-700" />
                        <button
                            onClick={() => setShowCommentInput(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white hover:bg-blue-500/20 rounded transition-colors"
                            title="Comment"
                        >
                            <MessageSquare size={16} className="text-blue-400" />
                            <span>Comment</span>
                        </button>
                        <div className="w-px h-6 bg-gray-700" />
                        <button
                            onClick={handleAnalyze}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white hover:bg-purple-500/20 rounded transition-colors"
                            title="Analyze"
                        >
                            <Search size={16} className="text-purple-400" />
                            <span>Analyze</span>
                        </button>
                    </div>
                )}

                {/* Color Picker */}
                {showColorPicker && (
                    <div className="p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Choose color</span>
                            <button onClick={closePopup} className="text-gray-500 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex gap-2 mb-2">
                            {HIGHLIGHT_COLORS.map(color => (
                                <button
                                    key={color.name}
                                    onClick={() => handleHighlight(color.name)}
                                    className={`w-7 h-7 rounded-full ${color.class} border-2 ${color.border} hover:scale-110 transition-transform`}
                                    title={color.name}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            value={highlightNote}
                            onChange={(e) => setHighlightNote(e.target.value)}
                            placeholder="Add a note (optional)"
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500"
                        />
                    </div>
                )}

                {/* Comment Input */}
                {showCommentInput && (
                    <div className="p-3 min-w-[280px]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-400">Add comment</span>
                            <button onClick={closePopup} className="text-gray-500 hover:text-white">
                                <X size={14} />
                            </button>
                        </div>
                        <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-800/50 rounded max-h-16 overflow-y-auto">
                            "{selectedText.length > 100 ? selectedText.slice(0, 100) + '...' : selectedText}"
                        </div>
                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Write your comment..."
                            className="w-full px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 resize-none"
                            rows={3}
                            autoFocus
                        />
                        <button
                            onClick={handleComment}
                            disabled={!commentText.trim()}
                            className="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded text-sm font-medium transition-colors"
                        >
                            Add Comment
                        </button>
                    </div>
                )}
            </div>
            
            {/* Arrow pointing down */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-700" />
        </div>
    );
};

export default TextSelectionPopup;
