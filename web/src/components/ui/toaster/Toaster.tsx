'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as ToasterSonner } from 'sonner';
import { CircleCheck } from '@/components/ui/icons';

type ToasterProps = React.ComponentProps<typeof ToasterSonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <ToasterSonner
      position="top-center"
      expand={true}
      visibleToasts={5}
      icons={{
        success: <CircleCheck />
      }}
      swipeDirections={['right']}
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-border group-[.toast]:text-foreground'
        }
      }}
      {...props}
    />
  );
};

export { Toaster };
