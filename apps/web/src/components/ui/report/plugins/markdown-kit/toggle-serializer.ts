import { deserializeMd, type MdNodeParser, parseAttributes, serializeMd } from '@platejs/markdown';

export const toggleSerializer: MdNodeParser<'toggle'> = {
  serialize: (node, options) => {
    if (!options.editor) {
      throw new Error('Editor is required');
    }

    const doc = (options as any).value ?? options.editor.children;
    const nodeIndex = doc.indexOf(node as any);
    const contentNodes: any[] = [];
    
    for (let i = nodeIndex + 1; i < doc.length; i++) {
      const sibling = doc[i] as any;
      const siblingIndent = sibling?.indent ?? 0;
      
      if (siblingIndent >= 1) {
        contentNodes.push(sibling);
      } else {
        break;
      }
    }

    const content = serializeMd(options.editor, {
      ...options,
      value: contentNodes.length ? contentNodes : [{ type: 'p', children: [{ text: '' }] }],
    });

    const attrs: string[] = [`content="${content}"`];
    
    if ((node as any).id) {
      attrs.push(`id="${(node as any).id}"`);
    }
    
    if ((node as any).indent !== undefined && (node as any).indent !== null) {
      attrs.push(`indent="${(node as any).indent}"`);
    }

    return {
      type: 'html',
      value: `<toggle ${attrs.join(' ')}></toggle>`,
    };
  },
  deserialize: (node, _, options) => {
    const typedAttributes = parseAttributes(node.attributes) as {
      content: string;
      id?: string;
      indent?: string | number;
    };

    if (!options.editor) {
      throw new Error('Editor is required');
    }

    try {
      const deserializedContent = deserializeMd(options.editor, typedAttributes.content);
      
      const toggleNode: any = {
        type: 'toggle',
        children: [{ text: '' }],
      };

      if (typedAttributes.id) {
        toggleNode.id = typedAttributes.id;
      }

      if (typedAttributes.indent !== undefined && typedAttributes.indent !== null) {
        toggleNode.indent = typeof typedAttributes.indent === 'string' 
          ? parseInt(typedAttributes.indent, 10) 
          : typedAttributes.indent;
      }

      const contentNodes = Array.isArray(deserializedContent) ? deserializedContent : [deserializedContent];
      const processedContentNodes = contentNodes.map((contentNode: any) => {
        const currentIndent = contentNode.indent ?? 0;
        return {
          ...contentNode,
          indent: currentIndent >= 1 ? currentIndent : 1,
        };
      });

      return [toggleNode, ...processedContentNodes] as any;
    } catch (error) {
      console.error('Error deserializing content', error);
      const result: any = {
        type: 'toggle',
        children: [{ text: typedAttributes.content }],
      };

      if (typedAttributes.id) {
        result.id = typedAttributes.id;
      }

      if (typedAttributes.indent !== undefined && typedAttributes.indent !== null) {
        result.indent = typeof typedAttributes.indent === 'string' 
          ? parseInt(typedAttributes.indent, 10) 
          : typedAttributes.indent;
      }

      return result;
    }
  },
};
