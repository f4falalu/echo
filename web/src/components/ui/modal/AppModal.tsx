'use client';

import React, { useMemo, useState } from 'react';
import { type ButtonProps, Button } from '../buttons/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from './ModalBase';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';

export interface ModalProps {
  className?: string;
  style?: React.CSSProperties;
  open: boolean;
  onClose: () => void;
  footer: {
    left?: React.ReactNode;
    primaryButton: {
      text: string;
      onClick: () => Promise<void> | (() => void);
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
    };
    secondaryButton?: {
      text: string;
      onClick: () => void;
      variant?: ButtonProps['variant'];
      loading?: boolean;
      disabled?: boolean;
    };
  };
  header: {
    title: React.ReactNode;
    description?: React.ReactNode;
  };
  width?: number;
  children?: React.ReactNode;
}

export const AppModal: React.FC<ModalProps> = React.memo(
  ({ open, onClose, footer, header, width = 600, className, style, children }) => {
    const [isLoadingPrimaryButton, setIsLoadingPrimaryButton] = useState(false);
    const [isLoadingSecondaryButton, setIsLoadingSecondaryButton] = useState(false);
    const onOpenChange = useMemoizedFn((open: boolean) => {
      if (!open) {
        onClose();
      }
    });

    const memoizedStyle = useMemo(
      () => ({
        minWidth: width ?? 600,
        maxWidth: width ?? 600,
        ...style
      }),
      [width, style]
    );

    const onPrimaryButtonClickPreflight = useMemoizedFn(async () => {
      setIsLoadingPrimaryButton(true);
      await footer.primaryButton.onClick();

      setIsLoadingPrimaryButton(false);
    });

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={className} style={memoizedStyle}>
          <div className="flex flex-col gap-4 overflow-hidden p-6">
            {header && (
              <DialogHeader>
                {header.title && <DialogTitle>{header.title}</DialogTitle>}
                {header.description && <DialogDescription>{header.description}</DialogDescription>}
              </DialogHeader>
            )}

            {children}
          </div>

          {footer && (
            <DialogFooter
              className={cn('flex items-center', footer.left ? 'justify-between' : 'justify-end')}>
              {footer.left && footer.left}
              <div className={cn('flex items-center space-x-2')}>
                {footer.secondaryButton && (
                  <Button
                    onClick={footer.secondaryButton.onClick}
                    variant={footer.secondaryButton.variant ?? 'ghost'}
                    loading={footer.secondaryButton.loading}
                    disabled={footer.secondaryButton.disabled}>
                    {footer.secondaryButton.text}
                  </Button>
                )}
                <Button
                  onClick={onPrimaryButtonClickPreflight}
                  variant={footer.primaryButton.variant ?? 'black'}
                  loading={footer.primaryButton.loading ?? isLoadingPrimaryButton}
                  disabled={footer.primaryButton.disabled}>
                  {footer.primaryButton.text}
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);

AppModal.displayName = 'AppModal';
