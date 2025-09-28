import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createMentionSuggestionExtension } from './createMentionSuggestionOption';
import { MentionInput } from './MentionInput';
import type { MentionInputTriggerItem } from './MentionInput.types';

const meta = {
  title: 'UI/Inputs/MentionInput',
  component: MentionInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      return (
        <div className="w-full p-3 m-3 bg-background">
          <Story />
        </div>
      );
    },
  ],
} satisfies Meta<typeof MentionInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const looneyTunesCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Bugs Bunny',
    label: 'Bugs Bunny',
  },
  {
    value: 'Daffy Duck',
    label: 'Daffy Duck',
  },
  {
    value: 'Porky Pig',
    label: 'Porky Pig',
  },
  {
    value: 'Tweety Bird',
    label: 'Tweety Bird',
  },
];

const theSimpsonsCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Homer Simpson',
    label: 'Homer Simpson',
  },
  {
    value: 'Marge Simpson',
    label: 'Marge Simpson',
  },
  {
    value: 'Bart Simpson',
    label: 'Bart Simpson',
  },
  {
    value: 'Lisa Simpson',
    label: 'Lisa Simpson',
  },
  {
    value: 'Maggie Simpson',
    label: 'Maggie Simpson',
  },
  {
    value: 'Ned Flanders',
    label: 'Ned Flanders',
  },
].map((item) => ({
  ...item,
  label: (
    <span className="inline gap-x-1 space-x-1">
      <img
        src={faker.image.url({
          width: 16,
          height: 16,
        })}
        alt=""
        className="w-3 h-3 rounded-full bg-item-active inline align-middle"
      />
      <span>{item.label}</span>
    </span>
  ),
}));

const arthurCharacters: MentionInputTriggerItem[] = [
  {
    value: 'Arthur Read',
    label: 'Arthur Read',
  },
  {
    value: 'Buster Baxter',
    label: 'Buster Baxter',
  },
  {
    value: 'Mr Ratburn',
    label: 'Mr Ratburn',
  },
].map((item) => ({
  ...item,
  label: (
    <span className="flex flex-col justify-between space-y-2 min-w-72 py-2">
      <h3 className="font-semibold text-gray-900 text-base leading-tight">{item.label}</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-16 text-gray-500 font-medium">Address:</span>
          <span>
            {faker.location.streetAddress()}, {faker.location.city()}
          </span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-16 text-gray-500 font-medium">Phone:</span>
          <span>{faker.phone.number()}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <span className="w-16 text-gray-500 font-medium">Birthday:</span>
          <span>
            {faker.date.birthdate({ min: 1970, max: 2005, mode: 'year' }).toLocaleDateString()}
          </span>
        </div>
      </div>
    </span>
  ),
}));

export const looneyTunesSuggestions = createMentionSuggestionExtension({
  trigger: '@',
  items: looneyTunesCharacters,
  popoverContent: (props) => {
    return <div>Hello {props.value}</div>;
  },
  pillStyling: {
    className: () => {
      return 'bg-purple-100 border-purple-300 text-purple-500 hover:bg-purple-200';
    },
  },
  onChangeTransform: (v) => {
    return `[@${String(v.label)}](${String(v.value)})`;
  },
});

const theSimpsonsSuggestions = createMentionSuggestionExtension({
  trigger: '#',
  items: theSimpsonsCharacters,
  pillStyling: {
    className: () => {
      return 'bg-blue-100 border-blue-300 text-blue-500 hover:bg-blue-200';
    },
  },
  popoverContent: (props) => {
    return <div>Howdy {props.value}</div>;
  },
});

const arthurSuggestions = createMentionSuggestionExtension({
  trigger: '$',
  items: arthurCharacters,
  pillStyling: {
    className: () => {
      return 'bg-green-100 border-green-300 text-green-500 hover:bg-green-200';
    },
  },
  popoverContent: (props) => {
    return <div>Ciao {props.value}</div>;
  },
});

export const Default: Story = {
  args: {
    mentions: [looneyTunesSuggestions, theSimpsonsSuggestions, arthurSuggestions],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic mention input component that supports @mentions. Type "@" to see the autocomplete suggestions.',
      },
    },
  },
};
