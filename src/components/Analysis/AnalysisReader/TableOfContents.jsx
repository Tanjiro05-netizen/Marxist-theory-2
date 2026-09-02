import React from 'react';
import { ChevronRight, BookOpen } from 'lucide-react';

const TOCItem = ({ item, activeSection, onSectionClick, depth = 0 }) => {
    const isActive = activeSection === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
        <li>
            <button
                onClick={() => onSectionClick(item.id)}
                className={`w-full text-left py-2 px-3 rounded-none transition-all duration-200 flex items-center group
                    ${isActive 
                        ? 'bg-red-600/20 text-red-400 border-l-2 border-red-500' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }
                    ${depth > 0 ? 'text-sm' : 'text-base font-medium'}
                `}
                style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
                <ChevronRight 
                    size={14} 
                    className={`mr-2 transition-transform ${isActive ? 'rotate-90 text-red-400' : 'text-gray-600 group-hover:text-gray-400'}`} 
                />
                <span className="truncate">{item.title}</span>
            </button>
            {hasChildren && (
                <ul className="mt-1">
                    {item.children.map((child) => (
                        <TOCItem
                            key={child.id}
                            item={child}
                            activeSection={activeSection}
                            onSectionClick={onSectionClick}
                            depth={depth + 1}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
};

const TableOfContents = ({ items, activeSection, onSectionClick, className = '' }) => {
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <nav className={`bg-gray-900/50 rounded-none p-4 ${className}`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <BookOpen size={20} className="mr-2 text-red-500" />
                Table of Contents
            </h3>
            <ul className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => (
                    <TOCItem
                        key={item.id}
                        item={item}
                        activeSection={activeSection}
                        onSectionClick={onSectionClick}
                    />
                ))}
            </ul>
        </nav>
    );
};

export default TableOfContents;
