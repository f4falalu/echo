import type { PropsWithChildren } from 'react';

export const Text: React.FC<PropsWithChildren> = ({ children }) => {
  return <span className="text-text-default text-base">{children}</span>;
};
