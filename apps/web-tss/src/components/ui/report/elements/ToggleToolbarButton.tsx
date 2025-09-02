'use client';

import { useToggleToolbarButton, useToggleToolbarButtonState } from '@platejs/toggle/react';
import type * as React from 'react';
import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { NodeTypeIcons } from '../config/icons';
import { createLabel } from '../config/labels';

export function ToggleToolbarButton(props: React.ComponentProps<typeof ToolbarButton>) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={createLabel('toggle')}>
      <NodeTypeIcons.toggle />
    </ToolbarButton>
  );
}
