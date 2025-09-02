'use client';

import { useEditorRef } from 'platejs/react';

import * as React from 'react';

import MessagePen from '@/components/ui/icons/NucleoIconOutlined/message-pen';
import { ToolbarButton } from '@/components/ui/toolbar/Toolbar';
import { createLabel } from '../config/labels';
import { commentPlugin } from '../plugins/comment-kit';

export function CommentToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip={createLabel('comment')}
    >
      <MessagePen />
    </ToolbarButton>
  );
}
