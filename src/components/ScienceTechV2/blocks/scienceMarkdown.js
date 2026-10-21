import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Shared markdown + KaTeX rendering for all science block components.
const markdownComponents = {
  h1: ({ children }) => <h1 className="text-3xl font-bold text-white mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-2xl font-bold text-white mt-6 mb-3 border-b border-gray-800 pb-2">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h3>,
  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-6 text-gray-300 mb-4 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-6 text-gray-300 mb-4 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  code: ({ inline, children }) => inline
    ? <code className="bg-black/50 border border-gray-800 px-1.5 py-0.5 text-red-300 text-sm">{children}</code>
    : <pre className="bg-black/60 p-4 overflow-x-auto border border-gray-800"><code className="text-gray-300 text-sm">{children}</code></pre>,
  blockquote: ({ children }) => <blockquote className="border-l-2 border-red-800 pl-4 italic text-gray-400">{children}</blockquote>,
  table: ({ children }) => <table className="w-full border-collapse my-4">{children}</table>,
  th: ({ children }) => <th className="border border-gray-700 px-3 py-2 text-left text-white bg-black/40">{children}</th>,
  td: ({ children }) => <td className="border border-gray-700 px-3 py-2 text-gray-300">{children}</td>,
};

export const renderScienceMarkdown = (body) => (
  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={markdownComponents}>
    {body || ''}
  </ReactMarkdown>
);
