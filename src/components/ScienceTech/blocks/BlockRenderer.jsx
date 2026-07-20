import React from 'react';
import TextBlock from './TextBlock';
import CalloutBlock from './CalloutBlock';
import ImageBlock from './ImageBlock';
import VideoBlock from './VideoBlock';
import WorkedExampleBlock from './WorkedExampleBlock';
import InlineExerciseBlock from './InlineExerciseBlock';
import CodeSandboxBlock from './CodeSandboxBlock';
import InteractiveWidgetBlock from './InteractiveWidgetBlock';
import SummaryBlock from './SummaryBlock';
import DividerBlock from './DividerBlock';
import EmbedBlock from './EmbedBlock';
import TableBlock from './TableBlock';

const blockComponents = {
  text: TextBlock,
  callout: CalloutBlock,
  image: ImageBlock,
  video: VideoBlock,
  worked_example: WorkedExampleBlock,
  inline_exercise: InlineExerciseBlock,
  code_sandbox: CodeSandboxBlock,
  interactive_widget: InteractiveWidgetBlock,
  summary: SummaryBlock,
  divider: DividerBlock,
  embed: EmbedBlock,
  table: TableBlock,
};

const BlockRenderer = ({ blocks }) => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className="space-y-6">
      {blocks.map((block, index) => {
        const Component = blockComponents[block.type];
        if (!Component) {
          if (process.env.NODE_ENV === 'development') {
            return (
              <div key={index} className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4 text-yellow-300 text-sm">
                Unknown block type: <code className="bg-black/30 px-1 rounded">{block.type}</code>
              </div>
            );
          }
          return null;
        }
        return <Component key={index} block={block} />;
      })}
    </div>
  );
};

export default BlockRenderer;
