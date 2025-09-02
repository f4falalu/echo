'use client';

import { StreamingText } from '../elements/StreamingText';
import { StreamContentPlugin as BaseStreamContentPlugin } from './stream-content-plugin';

export const StreamContentPluginColored = BaseStreamContentPlugin.withComponent(StreamingText);
