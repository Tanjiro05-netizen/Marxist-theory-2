import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const cellComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-black/30 px-1 py-0.5 rounded text-xs">{children}</code>,
};

const RichCell = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={cellComponents}
  >
    {String(content)}
  </ReactMarkdown>
);

const TableBlock = ({ block }) => {
  const headers = block.headers || [];
  const rows = block.rows || [];
  const caption = block.caption;

  if (headers.length === 0 && rows.length === 0) return null;

  return (
    <div className="my-2">
      {caption && (
        <p className="text-gray-500 text-xs mb-2 italic">{caption}</p>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full border-collapse">
          {headers.length > 0 && (
            <thead>
              <tr className="bg-black/40">
                {headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="text-left text-white font-semibold text-sm px-4 py-3 border-b border-gray-700"
                  >
                    <RichCell content={header} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`${rowIdx % 2 === 0 ? 'bg-black/20' : 'bg-black/10'} hover:bg-black/30 transition-colors`}
              >
                {(Array.isArray(row) ? row : []).map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="text-gray-300 text-sm px-4 py-2.5 border-t border-gray-800/50"
                  >
                    <RichCell content={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableBlock;
