import type { Descendant, TElement, Value } from 'platejs';
import type { IReportEditor } from '../../ReportEditor';
import { preprocessMarkdownForMdx } from './escape-handlers';
import { postProcessToggleDeserialization, postProcessToggleMarkdown } from './toggle-serializer';

export const markdownToPlatejs = async (
  editor: IReportEditor,
  markdown: string
): Promise<Value> => {
  try {
    // Pre-process markdown to escape < symbols that aren't part of HTML tags
    const processedMarkdown = preprocessMarkdownForMdx(markdown);
    const descendants: Value = editor.api.markdown.deserialize(processedMarkdown);
    const descendantsWithIds: Value = descendants.map((element, index) => ({
      ...element,
      id: `id-${index}`,
    }));
    return postProcessToggleDeserialization(descendantsWithIds);
  } catch (error) {
    console.error('Error converting markdown to PlateJS:', error);
    return [];
  }
};

export const platejsToMarkdown = async (
  editor: IReportEditor,
  elements: Value
): Promise<string> => {
  const markdown = editor.api.markdown.serialize({ value: elements as Descendant[] });

  // Apply post-processing to handle toggle serialization
  return postProcessToggleMarkdown(markdown);
};
