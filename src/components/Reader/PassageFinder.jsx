import React from 'react';
import { Search, ArrowRight } from 'lucide-react';

const PassageFinder = ({
  query,
  onQueryChange,
  results = [],
  onSelectResult,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-none p-3 space-y-3 mb-4 no-pdf">
      <div className="flex items-center gap-2">
        <Search size={16} className="text-red-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Find passages by concept, argument, or phrase..."
          className="bg-transparent w-full text-sm focus:outline-none"
        />
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-white"
        >
          Close
        </button>
      </div>

      {query.trim().length < 2 ? (
        <p className="text-xs text-gray-500">Type at least 2 characters to rank relevant passages.</p>
      ) : results.length === 0 ? (
        <p className="text-xs text-gray-500">No ranked passages found.</p>
      ) : (
        <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => onSelectResult(result)}
                className="w-full text-left p-2 rounded-none bg-gray-900/70 hover:bg-gray-700/80 transition-colors"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs text-red-300 font-medium">{result.heading || 'Passage'}</span>
                  <span className="text-[11px] text-gray-400">Score {result.score.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-300 mt-1 line-clamp-3">{result.snippet}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 mt-1">
                  Jump to passage <ArrowRight size={12} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PassageFinder;
