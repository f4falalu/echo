import { queryKeys } from '@/api/query_keys';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { cn } from '@/lib/classMerge';
import { useQuery } from '@tanstack/react-query';

export const GeneratingContent = ({
  messageId,
  className
}: {
  messageId: string;
  className?: string;
}) => {
  const { data: text } = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data'],
    select: (data) => data
  });

  return (
    <div
      className={cn('right-0 bottom-0 left-0 -mt-68 flex items-center justify-center', className)}>
      <div className="border-border item-center flex w-full justify-center rounded border px-8 py-1.5 shadow">
        <ShimmerText text={text || 'Generating content...'} className="text-lg" />
      </div>
    </div>
  );
};
