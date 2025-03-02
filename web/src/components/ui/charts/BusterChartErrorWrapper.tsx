import { ErrorCard } from '@/components/ui/error/ErrorCard';
import { ReactNode } from 'react';
import { ErrorBoundary } from '../error/ErrorBoundary';

interface Props {
  children: ReactNode;
}

const ErrorCardComponent: React.FC = () => {
  return (
    <ErrorCard error="Something went wrong rendering the chart. This is likely an error on our end. Please contact Buster support." />
  );
};

export const BusterChartErrorWrapper: React.FC<Props> = ({ children }) => {
  return <ErrorBoundary errorComponent={<ErrorCardComponent />}>{children}</ErrorBoundary>;
};
