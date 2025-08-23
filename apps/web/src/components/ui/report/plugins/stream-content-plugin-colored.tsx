'use client';

import { StreamContentPlugin as BaseStreamContentPlugin } from './stream-content-plugin';
import { StreamingText } from '../elements/StreamingText';

export const StreamContentPluginColored = BaseStreamContentPlugin.withComponent(StreamingText);
