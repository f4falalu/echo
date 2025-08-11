'use client';

import { BannerPlugin } from './banner-plugin';
import { CharacterCounterPlugin } from './character-counter-kit';
import { MetricKit } from './metric-kit';

export const BusterStreamKit = [
  //BannerPlugin,
  CharacterCounterPlugin,
  ...MetricKit
];
