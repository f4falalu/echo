import type React from 'react';
import type { MentionInputTriggerSeparator } from '../MentionInput.types';

export const MentionListSeperator: React.FC<MentionInputTriggerSeparator> = () => {
  return <hr className="border-border border-t w-full" />;
};
