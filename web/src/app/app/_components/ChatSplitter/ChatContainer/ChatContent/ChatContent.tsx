import React from 'react';
import { useChatSplitterContextSelector } from '../../ChatSplitterContext';

const colors = [
  'red-200',
  'blue-200',
  'green-200',
  'yellow-200',
  'purple-200',
  'pink-200',
  'indigo-200',
  'gray-200',
  'orange-200',
  'teal-200',
  'cyan-200',
  'lime-200'
];

export const ChatContent: React.FC<{ chatContentRef: React.RefObject<HTMLDivElement> }> = ({
  chatContentRef
}) => {
  const hasFile = useChatSplitterContextSelector((state) => state.hasFile);

  return (
    <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
      <div className="mx-auto max-w-[600px]">
        {Array.from({ length: 350 }).map((_, index) => (
          <div key={index} className={`h-10 bg-${colors[index % 12]}`}>
            {index}
          </div>
        ))}
      </div>
    </div>
  );
};
