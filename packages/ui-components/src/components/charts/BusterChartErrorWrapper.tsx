import type React from 'react';
import type { ReactNode } from 'react';
import { ErrorBoundary } from '../error/ErrorBoundary';

interface Props {
  children: ReactNode;
}

const ErrorCardComponent: React.FC = () => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-red-800">Chart rendering error</h3>
        <p className="text-sm text-red-700">
          Something went wrong rendering the chart. This is likely an error on our end. Please
          contact Buster support.
        </p>
      </div>
    </div>
  );
};

export const BusterChartErrorWrapper: React.FC<Props> = ({ children }) => {
  return <ErrorBoundary errorComponent={<ErrorCardComponent />}>{children}</ErrorBoundary>;
};
