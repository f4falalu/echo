import { KEYS } from 'platejs';
import { BlockPlaceholderPlugin } from 'platejs/react';

export const BlockPlaceholderKit = [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
      placeholders: {
        [KEYS.p]: 'Write or type "/" for commands...',
        [KEYS.h1]: 'Heading 1',
        [KEYS.h2]: 'Heading 2',
        [KEYS.h3]: 'Heading 3',
        [KEYS.h4]: 'Heading 4',
        [KEYS.h5]: 'Heading 5',
        [KEYS.h6]: 'Heading 6',
      },
      query: ({ path }) => {
        return path.length === 1;
      },
    },
  }),
];
