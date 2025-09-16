import { Command } from 'cmdk';
import type React from 'react';

interface BusterInputListProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  show?: boolean;
}

export const BusterInputList = ({
  className,
  style,
  children,
  show = true,
}: BusterInputListProps) => {
  if (!show) return null;
  return (
    <Command.List className={className} style={style}>
      {children}
    </Command.List>
  );
};
