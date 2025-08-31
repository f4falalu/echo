import type React from 'react';
import { cn } from '@/lib/classMerge';
import type { PanelElement } from './AppSplitter.types';

interface IPanelProps {
  children: React.ReactNode;
  width?: number | 'auto';
  height?: number | 'auto';
  minSize?: number;
  maxSize?: number;
  className?: string;
  hidden?: boolean;
  style?: React.CSSProperties;
  as?: PanelElement;
}

export const Panel: React.FC<IPanelProps> = ({
  children,
  width,
  height,
  minSize,
  maxSize,
  className,
  hidden,
  style,
  as = 'div',
}) => {
  if (hidden) return null;

  const panelStyle: React.CSSProperties = {
    ...style,
    ...(width !== 'auto' && width !== undefined && { width: `${width}px` }),
    ...(height !== 'auto' && height !== undefined && { height: `${height}px` }),
    ...(minSize !== undefined && { minWidth: `${minSize}px`, minHeight: `${minSize}px` }),
    ...(maxSize !== undefined && { maxWidth: `${maxSize}px`, maxHeight: `${maxSize}px` }),
  };

  const Component = as;

  return (
    <Component
      className={cn(
        'panel overflow-hidden',
        width !== 'auto' || height !== 'auto' ? 'flex-shrink-0 flex-grow-0' : 'flex-1',
        className
      )}
      style={panelStyle}
    >
      {children}
    </Component>
  );
};

Panel.displayName = 'Panel';
