import { Command } from 'cmdk';
import type React from 'react';
import { useState } from 'react';
import { type DisplayTransformFunc, Mention, MentionsInput } from 'react-mentions';
import { cn } from '@/lib/utils';
import type { BusterInputProps } from './BusterInput.types';
import { DEFAULT_MENTION_MARKUP } from './parse-input';

const users = [
  { id: '1', display: 'BigNate' },
  { id: '2', display: 'ReactFan42' },
  { id: '3', display: 'NextJSDev' },
];

export const BusterInput = ({ defaultValue, value: valueProp, onChange }: BusterInputProps) => {
  const [value, setValue] = useState(valueProp ?? defaultValue);

  return (
    <div className="flex flex-col gap-2">
      <MentionsInput
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          console.log(e.target.value);
        }}
        placeholder="Type @ to mention…"
        style={{
          control: { fontSize: 16, minHeight: 46 },
          highlighter: { padding: 8 },
          input: { padding: 8 },
          suggestions: { backgroundColor: '#f8fafc' },
        }}
        classNames={{
          highlighter: 'bg-red-500/10',
          suggestions: 'bg-blue-500/20 border',
        }}
      >
        {/* Always render a valid Mention node */}
        <Mention
          trigger="@"
          markup={DEFAULT_MENTION_MARKUP}
          data={users}
          displayTransform={(_, display) => `@${display}`}
          appendSpaceOnAdd
          style={{ backgroundColor: '#e0e7ff', borderRadius: 4, padding: '0 0px' }}
        />
      </MentionsInput>

      <div className="w-full h-px bg-border" />

      <Command
        label="Command Menu"
        onValueChange={(e) => {
          console.log(e);
        }}
      >
        <Command.Input
          className="w-full outline-1 outline-amber-600"
          value={value}
          onValueChange={setValue}
          asChild
          autoFocus
          placeholder="Type @ to mention…"
        >
          <textarea />
        </Command.Input>
        <Command.List>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Letters">
            <CommandItem
              onSelect={() => {
                setValue('a');
              }}
            >
              a
            </CommandItem>
            <CommandItem>b</CommandItem>
            <CommandSeparator />
            <CommandItem>c</CommandItem>
          </CommandGroup>

          <CommandItem>Apple</CommandItem>
        </Command.List>
      </Command>
    </div>
  );
};

const CommandGroup = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Group>) => {
  return (
    <Command.Group
      className={cn(
        'text-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        props.className
      )}
      {...props}
    >
      {children}
    </Command.Group>
  );
};

const CommandItem = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Item>) => {
  return (
    <Command.Item
      className={cn(
        'data-[selected=true]:bg-item-hover data-[selected=true]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-base outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        props.className
      )}
      {...props}
    >
      {children}
    </Command.Item>
  );
};

const CommandSeparator = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Separator>) => {
  return (
    <Command.Separator className={cn('bg-border -mx-1 h-px', props.className)} {...props}>
      {children}
    </Command.Separator>
  );
};

const CommandEmpty = ({
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof Command.Empty>) => {
  return (
    <Command.Empty
      className={cn('text-gray-light py-6 text-center text-base', props.className)}
      {...props}
    >
      {children}
    </Command.Empty>
  );
};
