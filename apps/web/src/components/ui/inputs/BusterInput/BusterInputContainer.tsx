import type React from 'react';
import { cn } from '@/lib/classMerge';
import type { BusterInputContainerProps } from './BusterInput.types';

export const BusterInputContainer: React.FC<BusterInputContainerProps> = ({
  children,
  className,
  style,
  sendIcon,
  secondaryActions,
  submitting,
  disabled,
  onStop,
  onSubmit,
  variant,
}) => {
  return (
    <div data-testid="buster-input-container" className="flex flex-col gap-2">
      {children}
    </div>
  );
};
