'use client';

import * as React from 'react';

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react';
import { ChevronRight } from '@/components/ui/icons';

import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';

export function ToggleToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip="Toggle">
      <ChevronRight />
    </ToolbarButton>
  );
}
