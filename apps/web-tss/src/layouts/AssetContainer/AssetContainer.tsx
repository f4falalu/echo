import type React from 'react';

export const AssetContainer: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <div className="bg-red-100 h-full w-full">{children}</div>;
};
