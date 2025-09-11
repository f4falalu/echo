import React from 'react';
import { createAnimationStyle } from '../animation-common';
import type { AnimatedMarkdownProps } from './AnimatedMarkdown';
import TokenizedText from './TokenizedText';

export const animateTokenizedText = (
  text: string | React.ReactNode,
  animationsProps: Pick<
    AnimatedMarkdownProps,
    'animation' | 'animationDuration' | 'animationTimingFunction' | 'isStreamFinished'
  >
) => {
  if (!animationsProps.animation || animationsProps.animation.includes('none')) {
    return text;
  }

  const tokenizedText = Array.isArray(text) ? text : [text];

  const result = tokenizedText.map((item, index) => {
    if (typeof item === 'string') {
      return <TokenizedText key={`text-${index}`} text={item} {...animationsProps} />;
    } else if (React.isValidElement(item)) {
      const noAnimateElementTypes: React.ElementType[] = [
        'br',
        'ul',
        'ol',
        'td',
        'th',
        'pre',
        'code',
      ];
      const inlineElementTypes: React.ElementType[] = ['strong', 'em', 'del', 'code', 'a', 'span'];

      let typeName = item.type;
      if (typeof typeName === 'function') {
        typeName = typeName.name;
      }

      if (
        typeof typeName === 'string' &&
        noAnimateElementTypes.includes(typeName as React.ElementType)
      ) {
        // Render these elements directly without an animation wrapper
        return <React.Fragment key={`fragment-${index}`}>{item}</React.Fragment>;
      }

      // Determine display type based on element type
      const isInlineElement =
        typeof typeName === 'string' && inlineElementTypes.includes(typeName as React.ElementType);

      // For other React elements, wrap them in animation span if they are not container elements
      // whose children are already animated by the `components` prop of ReactMarkdown
      // This else block might still wrap elements if they are not explicitly handled
      // by the ReactMarkdown components mapping (e.g. custom components not passing animateText to children)
      // For standard HTML elements, the `components` mapping should handle animation of children.
      return (
        <span
          key={`react-element-${index}`}
          data-testid="other-markdown-element"
          style={{
            ...createAnimationStyle(animationsProps),
            whiteSpace: 'pre-wrap',
            display: isInlineElement ? 'inline' : 'inline-block',
          }}
        >
          {item}
        </span>
      );
    }
    return (
      <span
        key={`unknown-element-${index}`}
        data-testid="animated-markdown-element"
        style={{
          ...createAnimationStyle(animationsProps),
          whiteSpace: 'pre-wrap',
          display: 'inline',
        }}
      >
        {item}
      </span>
    );
  });

  return result;
};
