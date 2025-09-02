
import { LinkPlugin } from '@platejs/link/react';
import { LinkFloatingToolbar } from '../elements/LinkFloatingToolbar';
import { LinkElement } from '../elements/LinkNode';

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
      afterEditable: () => <LinkFloatingToolbar />,
    },
  }),
];
