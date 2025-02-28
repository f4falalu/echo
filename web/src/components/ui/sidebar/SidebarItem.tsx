import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/classMerge';
import { type ISidebarItem } from './interfaces';
import { cva, VariantProps } from 'class-variance-authority';

const itemVariants = cva(
  'flex items-center gap-2.5 rounded px-1.5 py-1.5 text-sm transition-colors',
  {
    variants: {
      variant: {
        default: 'hover:bg-item-hover text-text-default',
        emphasized: 'shadow bg-background border border-border text-text-default'
      },
      active: {
        true: '',
        false: ''
      },
      disabled: {
        true: 'cursor-not-allowed',
        false: ''
      }
    },
    compoundVariants: [
      {
        active: true,
        disabled: false,
        variant: 'default',
        className: 'bg-nav-item-select hover:bg-nav-item-select'
      },
      {
        active: true,
        disabled: false,
        variant: 'emphasized',
        className: 'bg-nav-item-select hover:bg-nav-item-select'
      },
      {
        active: false,
        disabled: true,
        variant: 'emphasized',
        className: 'bg-nav-item-select hover:bg-nav-item-select'
      },
      {
        active: false,
        disabled: false,
        variant: 'emphasized',
        className: 'hover:bg-item-hover '
      }
    ]
  }
);

export const SidebarItem: React.FC<ISidebarItem & VariantProps<typeof itemVariants>> = React.memo(
  ({ label, icon, route, id, disabled = false, active = false, variant = 'default' }) => {
    const ItemNode = disabled ? 'div' : Link;

    return (
      <ItemNode href={route} className={cn(itemVariants({ active, disabled, variant }))}>
        <span className="text-icon-size text-icon-color">{icon}</span>
        <span className="text-foreground truncate">{label}</span>
      </ItemNode>
    );
  }
);
