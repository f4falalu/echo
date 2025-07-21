import React from 'react';
import type { AnimatedMarkdownProps } from './AnimatedMarkdown';
import { animateTokenizedText, createAnimationStyle } from './animation-helpers';
import { cva } from 'class-variance-authority';
import { StreamingMessageCode } from '../../../streaming/StreamingMessageCode';
import { cn } from '@/lib/classMerge';
import { useAnimationContext, AnimationProvider } from './AnimationContext';

type MarkdownComponentProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
} & Pick<
  AnimatedMarkdownProps,
  'animation' | 'animationDuration' | 'animationTimingFunction' | 'isStreamFinished'
>;

type NonAnimatedMarkdownComponentProps = Omit<
  MarkdownComponentProps,
  'animation' | 'animationDuration' | 'animationTimingFunction' | 'isStreamFinished'
>;

// Components with animations
export const ParagraphComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  const { shouldStopAnimations } = useAnimationContext();

  return (
    <p style={style} className={className} data-testid="paragraph-component">
      {animateTokenizedText(children, {
        ...rest,
        animation: shouldStopAnimations ? 'none' : rest.animation
      })}
    </p>
  );
};

const headingVariants = cva('', {
  variants: {
    level: {
      h1: 'text-3xl ',
      h2: 'text-2xl',
      h3: 'text-xl',
      h4: 'text-lg',
      h5: 'text-md',
      h6: 'text-sm',
      base: 'font-bold'
    }
  }
});

export const HeaderComponent: React.FC<
  MarkdownComponentProps & { tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' } & {
    stripFormatting?: boolean;
  }
> = ({ children, className, style, tag, stripFormatting, ...rest }) => {
  const Tag = tag as keyof JSX.IntrinsicElements;

  return (
    <Tag
      style={style}
      className={cn(
        headingVariants({
          level: stripFormatting ? 'base' : tag
        }),
        className
      )}>
      {animateTokenizedText(children, rest)}
    </Tag>
  );
};

HeaderComponent.displayName = 'HeaderComponent';

export const BlockquoteComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <blockquote style={style} className={className}>
      {animateTokenizedText(children, rest)}
    </blockquote>
  );
};

export const StrongComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <strong style={style} className={className}>
      {children}
    </strong>
  );
};

export const EmphasisComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <em style={style} className={className}>
      {children}
    </em>
  );
};

export const DeleteComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <del style={style} className={className}>
      {children}
    </del>
  );
};

export const LinkComponent: React.FC<MarkdownComponentProps & { href?: string }> = ({
  children,
  className,
  style,
  href,
  ...rest
}) => {
  return (
    <a href={href} style={{ ...createAnimationStyle(rest), ...style }} className={className}>
      {children}
    </a>
  );
};

export const ImageComponent: React.FC<
  Omit<MarkdownComponentProps, 'children'> & { src?: string; alt?: string }
> = ({ className, style, src, alt, ...rest }) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      style={{ ...createAnimationStyle(rest), ...style }}
      className={className}
    />
  );
};

export const HorizontalRuleComponent: React.FC<Omit<MarkdownComponentProps, 'children'>> = ({
  className,
  style,
  ...rest
}) => {
  return <hr style={{ ...createAnimationStyle(rest), ...style }} className={className} />;
};

export const TableComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <table style={{ ...createAnimationStyle(rest), ...style }} className={className}>
      {children}
    </table>
  );
};

export const TableHeadComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <thead style={{ ...createAnimationStyle(rest), ...style }} className={className}>
      {children}
    </thead>
  );
};

export const TableBodyComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <tbody style={{ ...createAnimationStyle(rest), ...style }} className={className}>
      {children}
    </tbody>
  );
};

export const TableRowComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <tr style={{ ...createAnimationStyle(rest), ...style }} className={className}>
      {children}
    </tr>
  );
};

// Components WITHOUT animations (as specified)
export const UnorderedListComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  return (
    <ul style={style} className={cn(className, 'mt-1 space-y-1', 'list-inside', 'list-disc')}>
      {children}
    </ul>
  );
};

export const OrderedListComponent: React.FC<MarkdownComponentProps & { start?: number }> = ({
  children,
  className,
  style,
  start
}) => {
  return (
    <ol
      style={style}
      className={cn(className, 'mt-1 space-y-1', 'list-inside', 'list-decimal')}
      start={start}>
      {children}
    </ol>
  );
};

export const ListItemComponent: React.FC<MarkdownComponentProps> = ({
  children,
  className,
  style,
  ...rest
}) => {
  const numberOfChildren = React.Children.count(children);
  const stopAnimations = React.useRef(false);
  const previousChildrenLength = React.useRef(numberOfChildren);

  const numberOfChildrenIsLessThanPrevious = numberOfChildren < previousChildrenLength.current;
  previousChildrenLength.current = numberOfChildren;

  if (numberOfChildrenIsLessThanPrevious) {
    stopAnimations.current = true;
  }

  return (
    <AnimationProvider shouldStopAnimations={stopAnimations.current}>
      <li
        style={style}
        className={cn(
          className,
          '[&_span]:inline',
          // // Normal text flow
          'whitespace-normal',
          // Fix alignment of content
          '[&>span]:inline [&>span]:align-top',
          '[&>p]:inline [&>p]:align-top'
        )}>
        {animateTokenizedText(children, {
          ...rest,
          animation: stopAnimations.current ? 'none' : rest.animation
        })}
      </li>
    </AnimationProvider>
  );
};

export const TableCellComponent: React.FC<NonAnimatedMarkdownComponentProps> = ({
  children,
  className,
  style
}) => {
  return (
    <td style={style} className={className}>
      {children}
    </td>
  );
};

export const TableHeaderCellComponent: React.FC<NonAnimatedMarkdownComponentProps> = ({
  children,
  className,
  style
}) => {
  return (
    <th style={style} className={className}>
      {children}
    </th>
  );
};

export const BreakComponent: React.FC<Omit<NonAnimatedMarkdownComponentProps, 'children'>> = ({
  className,
  style
}) => {
  return <br style={style} className={className} />;
};

export const CodeComponent: React.FC<
  MarkdownComponentProps & {
    language?: string;
    isInline?: boolean;
  }
> = ({
  children,
  className,
  style,
  language: languageProp,
  isStreamFinished,
  isInline = false
}) => {
  const matchRegex = /language-(\w+)/.exec(className || '');
  const language = languageProp || (matchRegex ? matchRegex[1] : undefined);

  if (isInline) {
    return (
      //do not animate the code block
      <code style={style} className={cn(className, 'bg-item-select rounded-sm border px-1')}>
        {children}
      </code>
    );
  }

  return (
    <StreamingMessageCode
      isStreamFinished={isStreamFinished}
      text={children as string}
      fileName={language}
    />
  );
};
