'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import { KEYS } from 'platejs';
import { CUSTOM_KEYS } from '../config/keys';

export const CaptionKit = [
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed, CUSTOM_KEYS.metric],
      },
    },
  }),
];
