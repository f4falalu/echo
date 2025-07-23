import isNumber from 'lodash/isNumber';
import truncate from 'lodash/truncate';

const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const makeHumanReadble = (input: string | number | undefined | null): string => {
  if (!input && !isNumber(input)) {
    return '';
  }

  if (isNumber(input)) {
    return String(input);
  }

  if (input === null || input === undefined) {
    return '';
  }

  let convertedString: string;
  const inputString = String(input);

  // Check if input is in snake case
  if (inputString.includes('_')) {
    convertedString = inputString
      .split('_')
      .map((word) => capitalizeFirstLetter(word))
      .join(' ');
  }
  // Check if input is in camel case
  else if (/[a-z][A-Z]/.test(inputString)) {
    convertedString = inputString.replace(/([a-z])([A-Z])/g, '$1 $2');
    convertedString = capitalizeFirstLetter(convertedString);
  }
  // If input is already in a readable format
  else {
    convertedString = capitalizeFirstLetter(inputString);
  }

  return convertedString;
};

export const truncateText = (text: string, characters: number) => {
  if (text.length <= characters) return text;
  return truncate(text, { length: characters });
};
