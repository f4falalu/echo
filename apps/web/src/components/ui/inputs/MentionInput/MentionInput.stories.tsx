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
  {
    type: 'separator',
  },
  {
    value: 'Taz',
    label: 'Taz',
  },
  {
    value: 'Sylvester',
    label: 'Sylvester',
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
    <span className="gap-x-1 space-x-1">
      <img
        src={faker.image.url({
          width: 16,
          height: 16,
        })}
        alt=""
        className="w-3 h-3 rounded-full bg-item-active inline-block align-middle"
      />
      <span className="inline-block">{item.label}</span>
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
  pillLabel: item.label,
  label: (
    <span className="flex flex-col justify-between space-y-2 py-2 overflow-hidden">
      <h3 className="font-semibold text-gray-900 text-base leading-tight">{item.label}</h3>
      <div className="flex flex-col space-y-2">
        <div className="flex items-center text-sm text-gray-600 overflow-hidden">
          <span className="w-16 text-gray-500 font-medium truncate">Address:</span>
          <span className="truncate">
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
    return <div className="p-2">Hello {props.value}</div>;
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
    return <div className="p-2">Howdy {props.value}</div>;
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
    return <div className="p-2">Ciao {props.value}</div>;
  },
});

const manyCharacters: MentionInputTriggerItem[] = [
  {
    type: 'group',
    items: [
      {
        value: 'SpongeBob SquarePants',
        label: 'SpongeBob SquarePants',
      },
      {
        value: 'Patrick Star',
        label: 'Patrick Star',
      },
      {
        value: 'Squidward Tentacles',
        label: 'Squidward Tentacles',
      },
      {
        value: 'Mr. Krabs',
        label: 'Mr. Krabs',
      },
    ],
    label: 'SpongeBob SquarePants Characters',
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    items: [
      {
        value: 'Courage the Cowardly Dog',
        label: 'Courage the Cowardly Dog',
      },
      {
        value: 'Muriel Bagge',
        label: 'Muriel Bagge',
      },
      {
        value: 'Shaggy',
        label: 'Shaggy',
      },
      {
        value: 'Snake',
        label: 'Snake',
      },
    ],
    label: 'Courage the Cowardly Dog Characters',
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    label: 'Foster`s Home',
    items: [
      {
        value: 'Bloo',
        label: 'Bloo',
      },
      {
        value: 'Mac',
        label: 'Mac',
      },
      {
        value: 'Wilt',
        label: 'Wilt',
      },
      {
        value: 'Eduardo',
        label: 'Eduardo',
      },
    ],
  },
  {
    type: 'separator',
  },
  {
    type: 'group',
    label: 'Scooby-Doo Characters',
    items: [
      {
        value: 'Scooby-Doo',
        label: 'Scooby-Doo',
      },
      {
        value: 'Shaggy-Doo',
        label: 'Shaggy-Doo',
      },
      {
        value: 'Velma',
        label: 'Velma',
      },
      {
        value: 'Daphne',
        label: 'Daphne',
      },
    ],
  },
];

const spongebobSuggestions = createMentionSuggestionExtension({
  trigger: '%',
  items: manyCharacters,
  pillStyling: {
    className: () => {
      return 'bg-yellow-100 border-yellow-300 text-yellow-500 hover:bg-yellow-200';
    },
  },
  popoverContent: (props) => {
    return <div className="p-5 bg-red-100">This is a custom popover content for {props.value}</div>;
  },
});

export const Default: Story = {
  args: {
    mentions: [
      looneyTunesSuggestions,
      theSimpsonsSuggestions,
      arthurSuggestions,
      spongebobSuggestions,
    ],
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
