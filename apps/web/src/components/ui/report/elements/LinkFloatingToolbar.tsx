import { flip, offset, type UseVirtualFloatingOptions } from '@platejs/floating';
import { getLinkAttributes, safeDecodeUrl } from '@platejs/link';
import {
  FloatingLinkUrlInput,
  type LinkFloatingToolbarState,
  useFloatingLinkEdit,
  useFloatingLinkEditState,
  useFloatingLinkInsert,
  useFloatingLinkInsertState,
} from '@platejs/link/react';
import ReturnKeyIcon from '@/components/ui/icons/NucleoIconOutlined/return-key';

// Types
type FloatingLinkEditState = ReturnType<typeof useFloatingLinkEditState>;
type FloatingLinkInsertTextInputProps = ReturnType<typeof useFloatingLinkInsert>['textInputProps'];
type FloatingLinkEditButtonProps = ReturnType<typeof useFloatingLinkEdit>['editButtonProps'];
type FloatingLinkUnlinkButtonProps = ReturnType<typeof useFloatingLinkEdit>['unlinkButtonProps'];
type PopoverProps = React.HTMLAttributes<HTMLDivElement>;

import { validateUrl } from '@platejs/link';
import { cva } from 'class-variance-authority';
import type { TLinkElement } from 'platejs';
import { KEYS } from 'platejs';
import {
  useEditorRef,
  useEditorSelection,
  useFormInputProps,
  usePluginOption,
} from 'platejs/react';
import * as React from 'react';
import { Button } from '@/components/ui/buttons';
import { Separator } from '@/components/ui/separator';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { cn } from '@/lib/utils';
import { AppTooltip } from '../../tooltip';
import { NodeTypeIcons } from '../config/icons';
import { NodeTypeLabels } from '../config/labels';

const popoverVariants = cva(
  'scrollbar-hide bg-popover absolute z-50 overflow-x-auto rounded border p-2 whitespace-nowrap opacity-100 shadow print:hidden'
);

const linkInputVariants = cva(
  'flex h-7 w-full rounded border-none bg-transparent px-1.5 py-1 text-base placeholder:text-muted-foreground focus-visible:ring-transparent focus-visible:outline-none md:text-sm'
);

export function LinkFloatingToolbar({ state }: { state?: LinkFloatingToolbarState }) {
  const activeCommentId = usePluginOption({ key: KEYS.comment }, 'activeId');
  const activeSuggestionId = usePluginOption({ key: KEYS.suggestion }, 'activeId');

  const floatingOptions: UseVirtualFloatingOptions = React.useMemo(() => {
    return {
      middleware: [
        offset(8),
        flip({
          fallbackPlacements: ['bottom-end', 'top-start', 'top-end'],
          padding: 12,
        }),
      ],
      placement: activeSuggestionId || activeCommentId ? 'top-start' : 'bottom-start',
    };
  }, [activeCommentId, activeSuggestionId]);

  const insertState = useFloatingLinkInsertState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    hidden,
    props: insertProps,
    ref: insertRef,
    textInputProps,
  } = useFloatingLinkInsert(insertState);

  const editState = useFloatingLinkEditState({
    ...state,
    floatingOptions: {
      ...floatingOptions,
      ...state?.floatingOptions,
    },
  });
  const {
    editButtonProps,
    props: editProps,
    ref: editRef,
    unlinkButtonProps,
  } = useFloatingLinkEdit(editState);

  if (hidden) return null;

  return (
    <>
      <LinkInsertPopover ref={insertRef} props={insertProps} textInputProps={textInputProps} />
      <LinkEditPopover
        ref={editRef}
        props={editProps}
        editState={editState}
        editButtonProps={editButtonProps}
        unlinkButtonProps={unlinkButtonProps}
        textInputProps={textInputProps}
      />
    </>
  );
}

const LinkInsertPopover = React.forwardRef<
  HTMLDivElement,
  {
    props: PopoverProps;
    textInputProps: FloatingLinkInsertTextInputProps;
  }
>(({ props, textInputProps }, ref) => {
  return (
    <div ref={ref} className={popoverVariants()} {...props}>
      <LinkEditPopoverContent textInputProps={textInputProps} />
    </div>
  );
});
LinkInsertPopover.displayName = 'LinkInsertPopover';

const LinkEditPopover = React.forwardRef<
  HTMLDivElement,
  {
    props: PopoverProps;
    editState: FloatingLinkEditState;
    editButtonProps: FloatingLinkEditButtonProps;
    unlinkButtonProps: FloatingLinkUnlinkButtonProps;
    textInputProps: FloatingLinkInsertTextInputProps;
  }
>(({ props, editState, editButtonProps, unlinkButtonProps, textInputProps }, ref) => {
  const content = editState.isEditing ? (
    <LinkEditPopoverContent textInputProps={textInputProps} />
  ) : (
    <LinkEditButtons editButtonProps={editButtonProps} unlinkButtonProps={unlinkButtonProps} />
  );

  return (
    <div ref={ref} className={popoverVariants()} {...props}>
      {content}
    </div>
  );
});
LinkEditPopover.displayName = 'LinkEditPopover';

function LinkEditButtons({
  editButtonProps,
  unlinkButtonProps,
}: {
  editButtonProps: FloatingLinkEditButtonProps;
  unlinkButtonProps: FloatingLinkUnlinkButtonProps;
}) {
  return (
    <div className="box-content flex items-center">
      <Button variant={'ghost'} size={'default'} {...editButtonProps}>
        {NodeTypeLabels.editLink.label}
      </Button>

      <Separator orientation="vertical" className="mx-2 h-4" />

      <div className="flex items-center space-x-1">
        <LinkOpenButton />
        <Button
          variant={'ghost'}
          size={'default'}
          prefix={<NodeTypeIcons.unlink />}
          {...unlinkButtonProps}
        />
      </div>
    </div>
  );
}

function LinkOpenButton() {
  const editor = useEditorRef();
  const selection = useEditorSelection();

  const attributes = React.useMemo(
    () => {
      const entry = editor.api.node<TLinkElement>({
        match: { type: editor.getType(KEYS.link) },
      });
      if (!entry) {
        return {};
      }
      const [element] = entry;
      return getLinkAttributes(editor, element);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, selection]
  );

  return (
    // biome-ignore lint/a11y/useKeyWithMouseEvents: we will deal with it later
    <a
      {...attributes}
      onMouseOver={(e) => {
        e.stopPropagation();
      }}
      target="_blank"
    >
      <Button variant={'ghost'} size={'default'} prefix={<NodeTypeIcons.externalLink />}></Button>
    </a>
  );
}

function LinkEditPopoverContent({
  textInputProps,
}: {
  textInputProps: FloatingLinkInsertTextInputProps;
}) {
  const inputProps = useFormInputProps({
    preventDefaultOnEnterKeydown: true,
  });

  return (
    <div className="flex w-[330px] flex-col" {...inputProps}>
      <LinkUrlInputField />
      <Separator className="my-1" />
      <LinkTextInputField textInputProps={textInputProps} />
    </div>
  );
}

function LinkUrlInputField() {
  const inputClassName = linkInputVariants();
  const editor = useEditorRef();
  const { openInfoNotification } = useBusterNotifications();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="group flex items-center">
      <div className="text-icon-color flex items-center pr-1 pl-2">
        <NodeTypeIcons.linkIcon />
      </div>
      <div className="flex w-full items-center">
        <FloatingLinkUrlInput
          className={inputClassName}
          placeholder="Paste link"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            const isEnterKey = e.key === 'Enter';
            if (isEnterKey) {
              const value = e.currentTarget.value;
              const isValid = validateUrl(editor, value);
              if (!isValid) {
                openInfoNotification({
                  title: 'Please enter a valid URL',
                  message:
                    'Valid URL formats include: https://www.example.com, http://www.example.com, www.example.com',
                });
              }
            }
          }}
          data-plate-focus
        />
        <ReturnKeyIconTooltip show={isFocused} />
      </div>
    </div>
  );
}

function LinkTextInputField({
  textInputProps,
}: {
  textInputProps: FloatingLinkInsertTextInputProps;
}) {
  const inputClassName = linkInputVariants();
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="group flex items-center">
      <div className="text-muted-foreground flex items-center pr-1 pl-2">
        <NodeTypeIcons.textLink />
      </div>
      <div className="flex w-full items-center">
        <input
          className={inputClassName}
          placeholder="Text to display"
          data-plate-focus
          {...textInputProps}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        <ReturnKeyIconTooltip show={isFocused} />
      </div>
    </div>
  );
}

const ReturnKeyIconTooltip = ({ show }: { show: boolean }) => {
  return (
    <AppTooltip title="Press Enter to insert link">
      <div className={cn('text-icon-color group-hover:flex hidden items-center', show && 'flex!')}>
        <ReturnKeyIcon />
      </div>
    </AppTooltip>
  );
};
