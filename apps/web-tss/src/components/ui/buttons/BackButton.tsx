import { Link, type LinkProps } from '@tanstack/react-router';
import * as React from 'react';
import { cn } from '@/lib/classMerge';
import type { ILinkProps } from '@/types/routes';
import { ChevronLeft } from '../icons';
import { Button } from './Button';

interface BackButtonProps {
  onClick?: () => void;
  text?: string;
  size?: 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
  linkUrl?: ILinkProps;
  activeProps?: LinkProps['activeProps'];
  activeOptions?: LinkProps['activeOptions'];
}

export const BackButton: React.FC<BackButtonProps> = React.memo(
  ({ onClick, text = 'Back', className = '', style, ...rest }) => {
    return (
      <LinkWrapper {...rest}>
        <Button
          prefix={
            <div className="group-hover:text-foreground flex text-xs">
              <ChevronLeft />
            </div>
          }
          variant="link"
          onClick={onClick}
          className={cn(className, 'group pl-1.5')}
          style={style}
        >
          {text}
        </Button>
      </LinkWrapper>
    );
  }
);

BackButton.displayName = 'BackButton';

const LinkWrapper: React.FC<
  { children: React.ReactNode } & Pick<BackButtonProps, 'linkUrl' | 'activeProps' | 'activeOptions'>
> = ({ children, linkUrl, ...rest }) => {
  if (linkUrl) {
    return (
      <Link {...linkUrl} {...rest}>
        {children}
      </Link>
    );
  }
  return <>{children}</>;
};
