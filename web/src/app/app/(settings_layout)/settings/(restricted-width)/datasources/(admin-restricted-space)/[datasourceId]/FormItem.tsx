import React, { PropsWithChildren } from 'react';
import { Text } from '@/components/ui/typography';

export const FormItem: React.FC<PropsWithChildren<{ label: string }>> = ({ label, children }) => {
  return (
    <div className="grid grid-cols-[195px_1fr] items-center border-t p-4">
      <Text variant="secondary">{label}</Text>

      <div>{children}</div>
    </div>
  );
};
