import { deserializeMd, type MdNodeParser, parseAttributes, serializeMd } from '@platejs/markdown';

export const toggleSerializer: MdNodeParser<'toggle'> = {
  serialize: (node, options) => {
    if (!options.editor) {
      throw new Error('Editor is required');
    }

    console.log(node);

    const content = serializeMd(options.editor, {
      ...options,
      value: node.children,
    });

    console.log('content', content);

    return {
      type: 'html',
      value: `<toggle content="${content}"></toggle>`,
    };
  },
  deserialize: (node, _, options) => {
    const typedAttributes = parseAttributes(node.attributes) as {
      content: string;
    };

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    try {
      const deserializedContent = deserializeMd(options.editor, typedAttributes.content);
      return {
        type: 'toggle',
        children: deserializedContent,
      };
    } catch (error) {
      console.error('Error deserializing content', error);
      return {
        type: 'toggle',
        children: [{ text: typedAttributes.content }],
      };
    }
  },
};
