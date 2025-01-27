import React, { useMemo } from 'react';
import { useChatSplitterContextSelector } from '../../ChatLayoutContext';
import { useRouter } from 'next/navigation';
import type { FileType } from '@/api/buster_socket/chats';

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
  return (
    <div ref={chatContentRef} className="h-full w-full overflow-y-auto">
      <div className="mx-auto max-w-[600px]">
        {Array.from({ length: 150 }).map((_, index) => (
          <ChatContentItem key={index} index={index} />
        ))}
      </div>
    </div>
  );
};

const type = ['chat', 'dataset', 'collection', 'metric', 'dashboard'] as const;

const ChatContentItem = React.memo(({ index }: { index: number }) => {
  const onSetSelectedFile = useChatSplitterContextSelector((state) => state.onSetSelectedFile);
  const router = useRouter();
  const typeOfItem = type[index % type.length];
  const { isChat, isPureChat } = useMemo(
    () => ({
      isChat: index % 2 === 0,
      isPureChat: index % 16 === 0
    }),
    []
  );

  const link = useMemo(() => {
    if (isPureChat) {
      return `/app/chat/${index}`;
    } else if (isChat && typeOfItem !== 'chat') {
      return `/app/chat/${index}/${typeOfItem}/${index}`;
    } else {
      return `/app/chat/${typeOfItem}/${index}`;
    }
  }, [index, typeOfItem, isPureChat, isChat]);

  const onClick = () => {
    if (isPureChat) {
      router.push(link);
    } else {
      onSetSelectedFile({ id: index.toString(), type: typeOfItem as FileType });
    }
  };

  return (
    <div
      className={`h-10 cursor-pointer hover:bg-gray-100 bg-${colors[index % 12]}`}
      onClick={onClick}>
      {typeOfItem} - {index} - {isPureChat ? 'pure chat' : isChat ? 'chat' : 'file'}
    </div>
  );
});

ChatContentItem.displayName = 'ChatContentItem';
