'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';
import { CircleCheck, CircleXmark, CircleWarning } from '@/components/ui/icons';

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'light' } = useTheme();

  return (
    <Toaster
      position="top-center"
      expand={true}
      visibleToasts={5}
      icons={{
        success: <CircleCheck />,
        error: <CircleXmark />,
        warning: <CircleWarning />
      }}
      swipeDirections={['right']}
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-hard',
          description: 'group-[.toast]:text-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-border group-[.toast]:text-foreground'
        }
      }}
      {...props}
    />
  );
};
