import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AlertTriangle, Lightbulb, Info, BookOpen, Sparkles } from 'lucide-react';

const variantConfig = {
  definition: {
    icon: BookOpen,
    border: 'border-blue-500/40',
    bg: 'bg-blue-950/30',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-300',
    label: 'Definition',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/30',
    iconColor: 'text-amber-400',
    titleColor: 'text-amber-300',
    label: 'Warning',
  },
  tip: {
    icon: Lightbulb,
    border: 'border-green-500/40',
    bg: 'bg-green-950/30',
    iconColor: 'text-green-400',
    titleColor: 'text-green-300',
    label: 'Tip',
  },
  key_insight: {
    icon: Sparkles,
    border: 'border-purple-500/40',
    bg: 'bg-purple-950/30',
    iconColor: 'text-purple-400',
    titleColor: 'text-purple-300',
    label: 'Key Insight',
  },
  example: {
    icon: Info,
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-950/30',
    iconColor: 'text-cyan-400',
    titleColor: 'text-cyan-300',
    label: 'Example',
  },
};

const inlineMarkdownComponents = {
  p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="text-gray-200">{children}</em>,
  code: ({ children }) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm">{children}</code>,
  ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 space-y-1 ml-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 space-y-1 ml-1">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300">{children}</li>,
};

const CalloutBlock = ({ block }) => {
  const variant = variantConfig[block.variant] || variantConfig.tip;
  const Icon = variant.icon;
  const title = block.title || variant.label;

  return (
    <div className={`rounded-xl border ${variant.border} ${variant.bg} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 shrink-0 ${variant.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-sm mb-2 ${variant.titleColor}`}>
            {title}
          </h4>
          {block.content && (
            <div className="text-sm">
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={inlineMarkdownComponents}
              >
                {block.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalloutBlock;
