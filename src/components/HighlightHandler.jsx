import React, { useState, useEffect, useRef, useCallback } from 'react';

const HIGHLIGHT_CLASS = 'highlight-red';

/**
 * Compute the character offset of a Range's start/end within a container's
 * flattened textContent. Works regardless of how the DOM is wrapped
 * (e.g. NerRenderer entity spans).
 */
const getTextOffset = (container, node, offset) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    let charCount = 0;
    while (walker.nextNode()) {
        if (walker.currentNode === node) {
            return charCount + offset;
        }
        charCount += walker.currentNode.textContent.length;
    }
    return charCount;
};

/**
 * Given a container, charOffset, and charLength, create a native Range
 * that covers the matching text. Returns null if out-of-bounds.
 */
const createRangeFromOffset = (container, charOffset, charLength) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    let accumulated = 0;
    let startNode = null, startOff = 0, endNode = null, endOff = 0;
    const endOffset = charOffset + charLength;

    while (walker.nextNode()) {
        const nodeLen = walker.currentNode.textContent.length;
        if (!startNode && accumulated + nodeLen > charOffset) {
            startNode = walker.currentNode;
            startOff = charOffset - accumulated;
        }
        if (accumulated + nodeLen >= endOffset) {
            endNode = walker.currentNode;
            endOff = endOffset - accumulated;
            break;
        }
        accumulated += nodeLen;
    }

    if (!startNode || !endNode) return null;

    try {
        const range = document.createRange();
        range.setStart(startNode, startOff);
        range.setEnd(endNode, endOff);
        return range;
    } catch {
        return null;
    }
};

const HighlightHandler = ({ children, highlights, onAddHighlight }) => {
    const contentRef = useRef(null);
    const popupRef = useRef(null);
    const [showPopover, setShowPopover] = useState(false);
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 });
    const [pendingHighlight, setPendingHighlight] = useState(null);
    const showPopoverRef = useRef(false);

    // Keep ref in sync so event handlers never read stale state
    useEffect(() => { showPopoverRef.current = showPopover; }, [showPopover]);

    // ── Selection listener (registered once) ──
    useEffect(() => {
        const handleMouseUp = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
                if (showPopoverRef.current) setShowPopover(false);
                return;
            }

            const range = selection.getRangeAt(0);
            const text = range.toString().trim();

            if (text && contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
                const rect = range.getBoundingClientRect();
                const contentRect = contentRef.current.getBoundingClientRect();

                setPopoverPosition({
                    top: rect.top - contentRect.top - 44,
                    left: rect.left - contentRect.left + rect.width / 2 - 40,
                });

                const charOffset = getTextOffset(contentRef.current, range.startContainer, range.startOffset);
                const charLength = text.length;

                setPendingHighlight({
                    selected_text: text,
                    serialized_range: JSON.stringify({ charOffset, charLength }),
                });
                setShowPopover(true);
            } else if (showPopoverRef.current) {
                setShowPopover(false);
            }
        };

        const handleMouseDown = (e) => {
            if (showPopoverRef.current && popupRef.current && !popupRef.current.contains(e.target)) {
                setTimeout(() => {
                    const sel = window.getSelection();
                    if (!sel || !sel.toString().trim()) {
                        setShowPopover(false);
                    }
                }, 100);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []); // registered once — no stale closure thanks to refs

    // ── Apply saved highlights visually ──
    const applyHighlights = useCallback(() => {
        const container = contentRef.current;
        if (!container || !highlights || highlights.length === 0) return;

        // Remove previously applied highlight marks
        container.querySelectorAll(`mark.${HIGHLIGHT_CLASS}`).forEach((mark) => {
            const parent = mark.parentNode;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
            parent.normalize();
        });

        highlights.forEach((highlight) => {
            try {
                let charOffset, charLength;

                // Support both new JSON format and legacy rangy format
                if (highlight.serialized_range && highlight.serialized_range.startsWith('{')) {
                    const parsed = JSON.parse(highlight.serialized_range);
                    charOffset = parsed.charOffset;
                    charLength = parsed.charLength;
                } else {
                    // Legacy fallback: try to find the text by searching
                    const fullText = container.textContent;
                    const idx = fullText.indexOf(highlight.selected_text);
                    if (idx === -1) return;
                    charOffset = idx;
                    charLength = highlight.selected_text.length;
                }

                const range = createRangeFromOffset(container, charOffset, charLength);
                if (!range) return;

                const mark = document.createElement('mark');
                mark.className = HIGHLIGHT_CLASS;
                range.surroundContents(mark);
            } catch (e) {
                console.error('Failed to apply highlight:', e);
            }
        });
    }, [highlights]);

    useEffect(() => {
        if (contentRef.current) {
            const timer = setTimeout(applyHighlights, 150);
            return () => clearTimeout(timer);
        }
    }, [highlights, children, applyHighlights]);

    // ── Handle "Highlight" button click ──
    const handleHighlight = () => {
        if (!pendingHighlight) return;

        onAddHighlight(pendingHighlight);

        // Apply immediately in the DOM
        try {
            const { charOffset, charLength } = JSON.parse(pendingHighlight.serialized_range);
            const range = createRangeFromOffset(contentRef.current, charOffset, charLength);
            if (range) {
                const mark = document.createElement('mark');
                mark.className = HIGHLIGHT_CLASS;
                range.surroundContents(mark);
            }
        } catch { /* will be applied on next render via applyHighlights */ }

        setShowPopover(false);
        setPendingHighlight(null);
        window.getSelection()?.removeAllRanges();
    };

    return (
        <div ref={contentRef} style={{ position: 'relative' }}>
          {children}
          {showPopover && (
                <div
                    ref={popupRef}
                    className="highlight-popover bg-gray-800 border border-gray-600 rounded-none shadow-none p-1"
                    style={{
                        position: 'absolute',
                        top: `${popoverPosition.top}px`,
                        left: `${popoverPosition.left}px`,
                        zIndex: 1000,
                    }}
                >
                    <button
                        onClick={handleHighlight}
                        className="px-3 py-1 text-white bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                        Highlight
                    </button>
                </div>
            )}
            <style>{`
                .${HIGHLIGHT_CLASS},
                mark.${HIGHLIGHT_CLASS} {
                    background-color: rgba(239, 68, 68, 0.4);
                    color: inherit;
                    border-radius: 2px;
                }
            `}</style>
        </div>
    );
};

export default HighlightHandler;
