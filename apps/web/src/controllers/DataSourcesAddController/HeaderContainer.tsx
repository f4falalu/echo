import type React from 'react';
import { BackButton } from '@/components/ui/buttons';
import type { ILinkProps } from '@/types/routes';

export const HeaderContainer: React.FC<{
  buttonText: string;
  linkUrl: ILinkProps;
  onClick?: () => void;
}> = ({ onClick, linkUrl, buttonText }) => {
  return (
    <div className="mb-3">
      <BackButton linkUrl={linkUrl} onClick={onClick} text={buttonText} />
    </div>
  );
};
