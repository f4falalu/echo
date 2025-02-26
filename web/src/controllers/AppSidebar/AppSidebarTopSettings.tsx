import { BackButton } from '@/components/ui/buttons';
import React from 'react';

export const AppSidebarTopSettings: React.FC<{
  className?: string;
  style?: React.CSSProperties;
  onGoToHomePage: () => void;
}> = ({ style, onGoToHomePage, className = '' }) => {
  return (
    <BackButton style={style} className={className} onClick={onGoToHomePage} text="Settings" />
  );
};
