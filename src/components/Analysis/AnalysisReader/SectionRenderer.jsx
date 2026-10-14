import React, { forwardRef, useMemo } from 'react';
import { MessageSquare, Bookmark, Link2 } from 'lucide-react';
import { sanitizeRichHtml } from '../../../lib/sanitize-html.js';
import { glossifyHtml } from './glossifyHtml';
import { proseTheme } from '../../../styles/obsidianTheme.css.ts';

const SectionRenderer = forwardRef(({
    section,
    isActive,
    commentCount = 0,
    isBookmarked = false,
    onCommentClick,
    onBookmarkClick,
    onCrossRefClick,
    readingMode = false,
    glossaryIndex = null,
}, ref) => {
    const { id, title, level, content } = section;

    const HeadingTag = `h${Math.min(level + 1, 6)}`;

    const headingSizes = {
        1: 'text-2xl md:text-3xl',
        2: 'text-xl md:text-2xl',
        3: 'text-lg md:text-xl',
        4: 'text-base md:text-lg',
        5: 'text-base',
        6: 'text-sm',
    };

    const headingSize = headingSizes[level] || headingSizes[3];

    const annotatedHtml = useMemo(
        () => glossifyHtml(sanitizeRichHtml(formatContent(content)), glossaryIndex),
        [content, glossaryIndex]
    );

    return (
        <section
            ref={ref}
            id={`section-${id}`}
            className={`relative group py-6 border-b border-[color:var(--line-soft)] last:border-b-0 transition-colors duration-300
                ${isActive ? 'bg-[rgba(155,16,34,0.05)] -mx-4 px-4' : ''}
            `}
        >
            {/* Section Actions - appear on hover (analysis mode only) */}
            {!readingMode && <div className="absolute right-0 top-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onCommentClick?.(id)}
                    className="p-2 rounded-none border border-[color:var(--line)] bg-transparent hover:border-[color:var(--red-bright)] text-[color:var(--paper-dim)] hover:text-[color:var(--red-bright)] transition-colors flex items-center gap-1"
                    title="Comments"
                >
                    <MessageSquare size={16} />
                    {commentCount > 0 && (
                        <span className="text-xs">{commentCount}</span>
                    )}
                </button>
                <button
                    onClick={() => onBookmarkClick?.(id)}
                    className={`p-2 rounded-none border transition-colors
                        ${isBookmarked
                            ? 'border-[color:var(--red)] bg-[rgba(155,16,34,0.15)] text-[color:var(--red-bright)]'
                            : 'border-[color:var(--line)] bg-transparent hover:border-[color:var(--red-bright)] text-[color:var(--paper-dim)] hover:text-[color:var(--red-bright)]'
                        }`}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Section'}
                >
                    <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                    onClick={() => onCrossRefClick?.(id)}
                    className="p-2 rounded-none border border-[color:var(--line)] bg-transparent hover:border-[color:var(--red-bright)] text-[color:var(--paper-dim)] hover:text-[color:var(--red-bright)] transition-colors"
                    title="Create Cross-Reference"
                >
                    <Link2 size={16} />
                </button>
            </div>}

            {/* Section Title */}
            {title && (
                <HeadingTag
                    className={`font-medium text-[color:var(--paper)] mb-4 ${headingSize} flex items-center gap-3`}
                >
                    {!readingMode && <span className="text-[color:var(--red-bright)]/70 font-mono text-sm">
                        §{id}
                    </span>}
                    {title}
                </HeadingTag>
            )}

            {/* Section Content */}
            <div
                className={`${proseTheme} prose prose-invert max-w-none
                    prose-p:leading-relaxed prose-p:mb-4
                    prose-blockquote:py-2 prose-blockquote:px-4
                    prose-li:marker:text-red-500
                    prose-a:text-red-400 prose-a:no-underline hover:prose-a:underline
                "
                dangerouslySetInnerHTML={{ __html: annotatedHtml }}
            />

            {/* Comment indicator badge (analysis mode only) */}
            {!readingMode && commentCount > 0 && (
                <div className="absolute -left-2 top-8 w-1 h-8 bg-[color:var(--red)]" title={`${commentCount} comments`} />
            )}
        </section>
    );
});

SectionRenderer.displayName = 'SectionRenderer';

function formatContent(content) {
    if (!content) return '';
    
    // If content is already HTML, return as is
    if (content.includes('<p>') || content.includes('<div>')) {
        return content;
    }

    // Convert plain text with line breaks to paragraphs
    return content
        .split(/\n\n+/)
        .map(para => `<p>${para.replace(/\n/g, '<br/>')}</p>`)
        .join('');
}

export default SectionRenderer;
