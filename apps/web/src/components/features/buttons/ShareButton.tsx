import { Button } from '@/components/ui/buttons';
import { ShareRight } from '@/components/ui/icons';

export const ShareButton = () => {
  return <Button variant="ghost" prefix={<ShareRight />} data-testid="share-button" />;
};

ShareButton.displayName = 'ShareButton';
