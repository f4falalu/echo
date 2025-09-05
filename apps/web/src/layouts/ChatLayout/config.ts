import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import type { PanelSize } from '@/components/ui/layouts/AppSplitter';

export type LayoutMode = 'file-only' | 'both' | 'chat-only';

export const DEFAULT_CHAT_OPTION_SIDEBAR_SIZE: PanelSize = '380px';
export const DEFAULT_FILE_OPTION_SIDEBAR_SIZE: PanelSize = '385px';
export const MAX_CHAT_BOTH_SIDEBAR_SIZE: PanelSize = '585px';
export const DEFAULT_BOTH_LAYOUT: LayoutSize = ['380px', 'auto'];
export const DEFAULT_CHAT_ONLY_LAYOUT: LayoutSize = ['auto', '0px'];
export const DEFAULT_FILE_ONLY_LAYOUT: LayoutSize = ['0px', 'auto'];
