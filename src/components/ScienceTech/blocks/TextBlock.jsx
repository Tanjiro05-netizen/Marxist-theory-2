import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const markdownComponents = {
  h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
  h2: ({ children }) => <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>,
  h3: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
  h4: ({ children }) => <h4 className="text-base font-semibold text-gray-200 mt-3 mb-2">{children}</h4>,
  p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1 ml-2">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 mb-4 space-y-1 ml-2">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
  code: ({ inline, className, children }) => {
    if (inline) {
      return <code className="bg-red-900/30 px-1.5 py-0.5 rounded text-red-300 text-sm">{children}</code>;
    }
    const lang = className?.replace('language-', '') || '';
    return (
      <div className="relative my-4">
        {lang && (
          <span className="absolute top-2 right-3 text-xs text-gray-500 uppercase tracking-wide">{lang}</span>
        )}
        <pre className="bg-black/60 p-4 rounded-none overflow-x-auto border border-gray-800">
          <code className="text-gray-300 text-sm">{children}</code>
        </pre>
      </div>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-red-500 pl-4 my-4 italic text-gray-400">{children}</blockquote>
  ),
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-gray-200">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors">
      {children}
    </a>
  ),
  hr: () => <hr className="border-gray-800 my-6" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="border-b border-gray-600">{children}</thead>,
  th: ({ children }) => <th className="text-left text-white font-semibold px-3 py-2">{children}</th>,
  td: ({ children }) => <td className="text-gray-300 px-3 py-2 border-t border-gray-700/50">{children}</td>,
  img: ({ src, alt }) => (
    <figure className="my-4">
      <img src={src} alt={alt || ''} className="rounded-none max-w-full" loading="lazy" />
      {alt && <figcaption className="text-gray-500 text-xs mt-2 text-center">{alt}</figcaption>}
    </figure>
  ),
};

const TextBlock = ({ block }) => {
  if (!block.content) return null;

  return (
    <div className="prose prose-invert prose-red max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {block.content}
      </ReactMarkdown>
    </div>
  );
};

export default TextBlock;
