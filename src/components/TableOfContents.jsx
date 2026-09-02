import React, { useState, useEffect, useRef } from 'react';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')       // Replace spaces with -
        .replace(/&/g, '-and-')    // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')   // Remove all non-word chars
        .replace(/--+/g, '-');      // Replace multiple - with single -
};

const TableOfContents = ({ contentRef, content }) => {
    const [headings, setHeadings] = useState([]);
    const [activeId, setActiveId] = useState('');
    const observer = useRef(null);

        useEffect(() => {
        if (!content) return;

        const processor = unified().use(remarkParse);
        const tree = processor.parse(content);

        const extractedHeadings = [];
        tree.children.forEach(node => {
            if (node.type === 'heading' && [2, 3, 4].includes(node.depth)) {
                const text = node.children.map(child => child.value).join('');
                extractedHeadings.push({
                    id: slugify(text),
                    text: text,
                    level: node.depth
                });
            }
        });

        setHeadings(extractedHeadings);
    }, [content]);

    useEffect(() => {
        if (observer.current) {
            observer.current.disconnect();
        }

        observer.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                });
            },
            { rootMargin: '0% 0% -80% 0%' } // Trigger when heading is at the top 20% of the screen
        );

        const elements = contentRef.current.querySelectorAll('h2, h3, h4');
        elements.forEach(el => observer.current.observe(el));

        return () => observer.current.disconnect();
    }, [headings, contentRef]);

    const handleLinkClick = (e, id) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    if (headings.length === 0) {
        return null; // Don't render if there are no headings
    }

    return (
        <nav className="sticky top-24 p-4 bg-gray-800/50 rounded-none border border-gray-700 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-3">On this page</h3>
            <ul>
                {headings.map(heading => (
                    <li key={heading.id} style={{ marginLeft: `${(heading.level - 2) * 1}rem` }}>
                        <a 
                            href={`#${heading.id}`}
                            onClick={(e) => handleLinkClick(e, heading.id)}
                            className={`block py-1 text-sm transition-colors duration-200 ${activeId === heading.id ? 'text-red-400 font-semibold' : 'text-gray-400 hover:text-white'}`}>
                            {heading.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;
