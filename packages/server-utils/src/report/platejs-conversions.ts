import {
  type ReportElements,
  type ReportElementsWithIds,
  ReportElementsWithIdsSchema,
} from '@buster/database';
import type { Descendant } from 'platejs';
import type { ZodError } from 'zod';
import { SERVER_EDITOR } from './server-editor';

export const markdownToPlatejs = async (
  markdown: string
): Promise<{ error: ZodError | Error | null; elements: ReportElementsWithIds }> => {
  try {
    const descendants: ReportElements = SERVER_EDITOR.api.markdown.deserialize(markdown);
    const descendantsWithIds: ReportElementsWithIds = descendants.map((element, index) => ({
      ...element,
      id: `id-${index}`,
    }));

    const safeParsedElements = ReportElementsWithIdsSchema.safeParse(descendantsWithIds);

    return {
      error: safeParsedElements.error as ZodError,
      elements: descendantsWithIds,
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
