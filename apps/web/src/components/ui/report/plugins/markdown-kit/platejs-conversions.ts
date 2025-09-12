import type { Descendant, TElement, Value } from 'platejs';
import type { IReportEditor } from '../../ReportEditor';
import { postProcessToggleDeserialization, postProcessToggleMarkdown } from './toggle-serializer';

export const markdownToPlatejs = async (
  editor: IReportEditor,
  markdown: string
): Promise<Value> => {
  try {
    const descendants: Value = editor.api.markdown.deserialize(markdown);
    const descendantsWithIds: Value = descendants.map((element, index) => ({
      ...element,
      id: `id-${index}`,
    }));

    // Apply post-processing to handle details elements
    const processedElements = postProcessToggleDeserialization(descendantsWithIds as TElement[]);

    return processedElements as Value;
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
