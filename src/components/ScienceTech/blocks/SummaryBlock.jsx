import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CheckCircle } from 'lucide-react';

const inlineComponents = {
  p: ({ children }) => <span>{children}</span>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-black/30 px-1 py-0.5 rounded text-sm text-red-300">{children}</code>,
};

const SummaryBlock = ({ block }) => {
  const points = block.points || [];
  if (points.length === 0) return null;

  return (
    <div className="bg-[#10131b] from-red-950/30 to-black/40 rounded-none border border-red-900/30 p-6">
      <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-red-400" />
        Key Takeaways
      </h4>
      <ul className="space-y-3">
        {points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-3 text-gray-300 text-sm">
            <span className="text-red-500 mt-1 shrink-0 font-bold">{idx + 1}.</span>
            <span className="leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={inlineComponents}
              >
                {point}
              </ReactMarkdown>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SummaryBlock;
