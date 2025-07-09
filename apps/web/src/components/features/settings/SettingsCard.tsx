import React from 'react';
import { Title, Paragraph } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';

interface SettingsCardsProps {
  title: string;
  description: string;
  cards: {
    sections: React.ReactNode[];
  }[];
}

export const SettingsCards: React.FC<SettingsCardsProps> = ({ title, description, cards }) => {
  return (
    <div className="flex flex-col space-y-3.5">
      <div className="flex flex-col space-y-1.5">
        <Title as="h3" className="text-lg">
          {title}
        </Title>
        <Paragraph variant="secondary">{description}</Paragraph>
      </div>
      {cards.map((card, index) => (
        <SettingsCard key={index} sections={card.sections} />
      ))}
    </div>
  );
};

const SettingsCard = ({ sections }: { sections: React.ReactNode[] }) => {
  return (
    <div className="flex flex-col rounded border">
      {sections.map((section, index) => (
        <div key={index} className={cn(index !== sections.length - 1 && 'border-b', 'px-4 py-3.5')}>
          {section}
        </div>
      ))}
    </div>
  );
};
