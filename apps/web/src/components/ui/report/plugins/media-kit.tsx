import {
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
} from '@platejs/media/react';
import { MediaEmbedElement } from '../elements/MediaEmbedNode';
import { ImageElement } from '../elements/MediaImageNode';
import { PlaceholderElement } from '../elements/MediaPlaceholderElement';
import { MediaUploadToast } from '../elements/MediaUploadToast';

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: {
      //  afterEditable: MediaPreviewDialog,
      node: ImageElement,
    },
  }),
  MediaEmbedPlugin.configure({
    node: {
      component: MediaEmbedElement,
      isSelectable: true,
      isElement: true,
    },
    options: {},
  }),

  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: false },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),

  // VideoPlugin.withComponent(VideoElement),
  // AudioPlugin.withComponent(AudioElement),
  // FilePlugin.withComponent(FileElement),
];
