'use client';

import React from 'react';
import type { PlateTextProps } from 'platejs/react';
import { PlateText, usePluginOption } from 'platejs/react';

import { StreamContentPlugin } from '../plugins/stream-content-plugin';

// Simple utility function for conditional class names
function cn(...classes: (string | string[] | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).flat().join(' ');
}

export function StreamingText(props: PlateTextProps) {
  const isStreaming = usePluginOption(StreamContentPlugin, 'isStreaming');
  // const streamingNode = props.editor
  //   .getApi(StreamContentPlugin)
  //   .streamContent.getCurrentStreamingNode();

  // const lastStreamingTextNode = props.editor
  //   .getApi(StreamContentPlugin)
  //   .streamContent.getLastStreamingTextNode();

  // Check if this text node is part of the currently streaming content
  const isStreamingText = false;

  // Check if this is the last text node in the streaming content (for the animated dot)
  const isLastStreamingText = isStreaming && false;

  return (
    <PlateText
      className={cn(
        isStreaming &&
          isStreamingText && [
            'border-b-2 border-b-purple-100 bg-purple-50 text-purple-800',
            'transition-all duration-200 ease-in-out'
          ],
        // Only show the animated dot on the last streaming text node
        isLastStreamingText && [
          'after:ml-1.5 after:inline-block after:h-3 after:w-3 after:animate-pulse after:rounded-full after:bg-purple-500 after:align-middle after:content-[""]'
        ]
      )}
      {...props}
    />
  );
}
