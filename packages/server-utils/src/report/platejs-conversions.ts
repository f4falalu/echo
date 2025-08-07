import { type ReportElements, ReportElementsSchema } from '@buster/database';
import type { Descendant } from 'platejs';
import { SERVER_EDITOR } from './server-editor';

export const markdownToPlatejs = async (markdown: string) => {
  try {
    const descendants = SERVER_EDITOR.api.markdown.deserialize(markdown);
    console.log('descendants', descendants);

    console.log('descendants.json', JSON.stringify(descendants, null, 2));

    const safeParsedElements = ReportElementsSchema.safeParse(descendants);

    console.log('safeParsedElements', safeParsedElements);

    return {
      error: safeParsedElements.error,
      elements: safeParsedElements.data,
    };
  } catch (error) {
    console.error('Error converting markdown to PlateJS:', error);
    return {
      error: error as Error,
      elements: [],
    };
  }
};

export const platejsToMarkdown = async (elements: ReportElements): Promise<string> => {
  return SERVER_EDITOR.api.markdown.serialize({ value: elements as Descendant[] });
};
