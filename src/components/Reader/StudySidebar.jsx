import React from 'react';
import { BookOpen, Highlighter, Sparkles } from 'lucide-react';

const StudySidebar = ({ concepts = [], highlights = [], onSelectConcept, onSelectHighlight }) => {
  return (
    <aside className="space-y-4">
      <div className="bg-gray-900/60 border border-gray-700 rounded-none p-4">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-red-400" />
          Study Concepts
        </h3>
        {concepts.length === 0 ? (
          <p className="text-xs text-gray-500">No concept matches found yet.</p>
        ) : (
          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {concepts.map((concept) => (
              <li key={concept.term}>
                <button
                  type="button"
                  onClick={() => onSelectConcept(concept)}
                  className="w-full text-left p-2 rounded-none bg-gray-800/60 hover:bg-gray-700/80 transition-colors"
                >
                  <p className="text-sm text-white font-medium">{concept.term}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{concept.explanation}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gray-900/60 border border-gray-700 rounded-none p-4">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-3 flex items-center gap-2">
          <Highlighter size={14} className="text-red-400" />
          Highlight Queue
        </h3>
        {highlights.length === 0 ? (
          <p className="text-xs text-gray-500">Create highlights to pin key passages.</p>
        ) : (
          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {highlights.slice(-8).reverse().map((highlight) => (
              <li key={highlight.id}>
                <button
                  type="button"
                  onClick={() => onSelectHighlight(highlight)}
                  className="w-full text-left text-xs text-gray-300 p-2 rounded-none bg-gray-800/50 hover:bg-gray-700/70 transition-colors"
                >
                  "{highlight.selected_text}"
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-none p-4">
        <h3 className="text-sm uppercase tracking-wide text-gray-400 mb-2 flex items-center gap-2">
          <BookOpen size={14} className="text-red-400" />
          Study Tip
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed">
          Alternate between concept lookup and highlighting to build a structured understanding of each chapter.
        </p>
      </div>
    </aside>
  );
};

export default StudySidebar;
