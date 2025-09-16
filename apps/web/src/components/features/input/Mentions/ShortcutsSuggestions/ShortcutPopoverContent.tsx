import { Paragraph } from '@/components/ui/typography/Paragraph';
import { Text } from '@/components/ui/typography/Text';
import type { MentionPopoverContentCallback } from '../MentionInput.types';

export const ShortcutPopoverContent: MentionPopoverContentCallback = ({ value }) => {
  const shortcutName = `TODO: ${value}`;
  const prompt = `TODO prompt that is actually pretty long: ${value}`;

  return (
    <div className="p-3 flex flex-col space-y-3 w-[215px]">
      <Section title="Shortcut name">
        <BlockText type="text">{shortcutName}</BlockText>
      </Section>
      <Section title="Prompt">
        <BlockText type="paragraph">{prompt}</BlockText>
      </Section>
      <hr className="w-full border-t" />
      <Paragraph
        variant={'tertiary'}
        size={'sm'}
      >{`Use shortcuts for your repeatable flows in Buster`}</Paragraph>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="flex flex-col gap-y-1">
      <Text size={'xs'} variant={'secondary'} truncate>
        {title}
      </Text>
      {children}
    </div>
  );
};

const BlockText = ({
  children,
  type,
}: {
  children: React.ReactNode;
  type: 'text' | 'paragraph';
}) => {
  const TextComponent = type === 'text' ? Text : Paragraph;
  return (
    <div className="bg-item-select border py-1.5 px-2.5 rounded">
      <TextComponent size={'sm'} variant={'secondary'}>
        {children}
      </TextComponent>
    </div>
  );
};
