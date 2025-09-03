import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';

export const LoadingCodeEditor = () => {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />
    </div>
  );
};
