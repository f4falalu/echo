'use client';
import React from 'react';
import { Title } from '../text';
import Link from 'next/link';
import { ChevronLeft } from '../icons';
import { Button } from './Button';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  size?: 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  linkUrl?: string;
}

export const BackButton: React.FC<BackButtonProps> = React.memo(
  ({ onClick, text = 'Back', className = '', style, linkUrl }) => {
    return (
      <LinkWrapper linkUrl={linkUrl}>
        <Button
          prefix={<ChevronLeft />}
          variant="link"
          onClick={onClick}
          className={className}
          style={style}>
          {text}
        </Button>
      </LinkWrapper>
    );
  }
);

BackButton.displayName = 'BackButton';

const LinkWrapper: React.FC<{ children: React.ReactNode; linkUrl?: string }> = ({
  children,
  linkUrl
}) => {
  if (linkUrl) {
    return <Link href={linkUrl}>{children}</Link>;
  }
  return <>{children}</>;
};
