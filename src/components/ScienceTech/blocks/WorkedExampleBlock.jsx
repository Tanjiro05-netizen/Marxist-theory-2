import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChevronDown, ChevronRight, BookOpen, Eye } from 'lucide-react';

const stepComponents = {
  p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-1 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  code: ({ inline, children }) =>
    inline
      ? <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-cyan-300">{children}</code>
      : <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto my-2"><code className="text-gray-300 text-sm">{children}</code></pre>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 space-y-1 ml-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-1">{children}</ol>,
};

const WorkedExampleBlock = ({ block }) => {
  const steps = block.steps || [];
  const [revealedCount, setRevealedCount] = useState(0);
  const [expanded, setExpanded] = useState(true);

  if (steps.length === 0) return null;

  const revealNext = () => {
    setRevealedCount((prev) => Math.min(prev + 1, steps.length));
  };

  const revealAll = () => {
    setRevealedCount(steps.length);
  };

  const allRevealed = revealedCount >= steps.length;

  return (
    <div className="bg-cyan-950/20 rounded-xl border border-cyan-800/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-cyan-950/10 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
          <BookOpen className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs text-cyan-400 uppercase tracking-wide font-medium">Worked Example</span>
          {block.title && (
            <h4 className="text-white font-semibold text-sm mt-0.5">{block.title}</h4>
          )}
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
        )}
      </button>

      {/* Steps */}
      {expanded && (
        <div className="border-t border-cyan-800/20">
          <div className="p-4 space-y-3">
            {steps.map((step, idx) => {
              const isRevealed = idx < revealedCount;
              return (
                <div
                  key={idx}
                  className={`transition-all duration-300 ${
                    isRevealed ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
                  }`}
                >
                  <div className="flex items-start gap-3 bg-black/20 rounded-lg p-3">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {step.label && (
                        <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wide mb-1">
                          {step.label}
                        </p>
                      )}
                      <div className="text-sm">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={stepComponents}
                        >
                          {step.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls */}
          {!allRevealed && (
            <div className="px-4 pb-4 flex items-center gap-3">
              <button
                onClick={revealNext}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Show Step {revealedCount + 1}
              </button>
              <button
                onClick={revealAll}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Show All
              </button>
              <span className="text-gray-600 text-xs ml-auto">
                {revealedCount}/{steps.length} steps
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkedExampleBlock;
