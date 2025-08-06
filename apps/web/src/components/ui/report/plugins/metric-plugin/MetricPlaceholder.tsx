import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { PopoverAnchor, PopoverBase, PopoverContent } from '@/components/ui/popover';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useClickAway } from '@/hooks/useClickAway';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/typography';
import type { PluginConfig, TElement } from 'platejs';
import {
  PlateElement,
  useEditorRef,
  useFocused,
  useReadOnly,
  useSelected,
  type PlateElementProps
} from 'platejs/react';
import React, { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/inputs';
import { Button } from '@/components/ui/buttons/Button';

export const MetricEmbedPlaceholder: React.FC<{ metricId: string }> = ({ ...props }) => {
  const [openModal, setOpenModal] = React.useState(false);
  const readOnly = useReadOnly();
  const selected = useSelected();
  const focused = useFocused();
  const editor = useEditorRef();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const { openInfoMessage } = useBusterNotifications();
  const [forceOpenPopover, setForceOpenPopover] = React.useState(false);

  const isOpenPopover = focused && selected && !readOnly;

  const onAddMetric = () => {
    setOpenModal(true);
    setForceOpenPopover(false);
    // const url = inputRef.current?.value;
    // if (!url) {
    //   openInfoMessage('Please enter a valid URL');
    //   return;
    // }
    // // Check if the URL is from an accepted domain
    // const isAccepted = isUrlFromAcceptedDomain(url);
    // if (!isAccepted) {
    //   openInfoMessage(
    //     `Please enter a valid URL from an accepted domain: ${ACCEPTED_DOMAINS.join(', ')}`
    //   );
    //   return;
    // }
    // // Update the current node with the URL
    // editor.tf.setNodes({ url }, { at: editor.api.findPath(props.element) });
    // setForceOpen(false);
  };

  useEffect(() => {
    if (isOpenPopover) {
      setForceOpenPopover(true);
    }
  }, [isOpenPopover]);

  useClickAway(
    (e) => {
      setForceOpenPopover(false);
      // e.preventDefault();
      // e.stopPropagation();
    },
    [popoverRef, anchorRef]
  );

  return (
    <div className="media-embed py-2.5">
      <PopoverBase open={forceOpenPopover}>
        <PopoverAnchor>
          <div
            ref={anchorRef}
            className={cn(
              'bg-muted hover:bg-primary/10 flex cursor-pointer items-center rounded-sm p-3 pr-9 select-none'
            )}
            contentEditable={false}>
            <div className="text-muted-foreground/80 relative mr-3 flex [&_svg]:size-6">
              <ASSET_ICONS.metrics />
            </div>

            <div className="text-muted-foreground text-sm whitespace-nowrap">Add a metric</div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          ref={popoverRef}
          className="flex w-[300px] flex-col px-0 py-2"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
          }}>
          <div className="px-3">
            <Text>Add an embed link</Text>
          </div>

          <Separator className="my-2" />

          <div className="flex flex-col space-y-2 px-3">
            <Input
              placeholder="Paste the link"
              autoFocus
              onPressEnter={onAddMetric}
              ref={inputRef}
            />
            <Button block variant={'black'} onClick={onAddMetric}>
              Add metric
            </Button>
          </div>
        </PopoverContent>
      </PopoverBase>
    </div>
  );
};
