import React from 'react';

const DividerBlock = ({ block }) => {
  if (block.label) {
    return (
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-500 text-xs uppercase tracking-widest shrink-0">
          {block.label}
        </span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>
    );
  }

  return <hr className="border-gray-800 my-6" />;
};

export default DividerBlock;
