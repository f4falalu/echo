import React from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '../collapsible/CollapsibleBase';
import { type ISidebarGroup } from './interfaces';
import { SidebarItem } from './SidebarItem';

export const SidebarGroup: React.FC<ISidebarGroup> = React.memo(({ label, items }) => {
  return <></>;
});
