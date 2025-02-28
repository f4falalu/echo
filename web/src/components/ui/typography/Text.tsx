import { cn } from '@/lib/classMerge';
import { cva, VariantProps } from 'class-variance-authority';
import React from 'react';
import { textColorVariants } from './variants';

const textVariants = cva('', {
  variants: {
    size: {
      '3xs': 'text-3xs',
      '2xs': 'text-2xs',
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
      '4xl': 'text-4xl'
    },
    truncate: {
      true: 'truncate',
      false: ''
    }
  }
});

type TextProps = {
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLSpanElement>;
  children: React.ReactNode;
} & VariantProps<typeof textVariants> &
  VariantProps<typeof textColorVariants>;

const Text: React.FC<TextProps> = ({
  variant = 'default',
  size = 'base',
  truncate,
  className,
  style,
  onClick,
  children
}) => {
  const TextNode = truncate ? 'div' : 'span';

  return (
    <TextNode
      style={style}
      className={cn(textVariants({ size, truncate }), textColorVariants({ variant }), className)}
      onClick={onClick}>
      {children}
    </TextNode>
  );
};

export default Text;
