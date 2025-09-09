import { useMount } from '@/hooks/useMount';
import { cn } from '@/lib/utils';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';
import { Text } from '../../typography/Text';

export const LoadingCodeEditor = ({ className = '', text = 'Loading code editor...' }) => {
  return (
    <div
      className={cn(
        'animate-in h-full flex flex-col items-center justify-center  duration-300',
        className
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <Text>{text}</Text>
        <CircleSpinnerLoaderContainer />
      </div>
    </div>
  );
};
