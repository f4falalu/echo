import { useMount } from '@/hooks/useMount';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';
import { Text } from '../../typography/Text';

export const LoadingCodeEditor = ({ text = 'Loading code editor...' }) => {
  return (
    <div className="animate-in h-full flex flex-col items-center justify-center  duration-300">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Text>{text}</Text>
        <CircleSpinnerLoaderContainer />
      </div>
    </div>
  );
};
