import React from 'react';
import { ExtraProps } from 'react-markdown';
import { AppCodeBlock } from '../AppCodeBlock/AppCodeBlock';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/classMerge';

export interface ExtraPropsExtra extends ExtraProps {
  numberOfLineMarkdown: number;
}

export const CustomCode: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    className?: string;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, className, node, ...rest }) => {
  const matchRegex = /language-(\w+)/.exec(className || '');
  const language = matchRegex ? matchRegex[1] : undefined;

  return (
    <AppCodeBlock wrapperClassName="my-2.5" className="leading-1.3" language={language}>
      {children}
    </AppCodeBlock>
  );
};

export const CustomParagraph: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  if (Array.isArray(children)) {
    return (
      <p
        className={cn(
          'leading-1.3 text-size-inherit!',
          showLoader && 'animate-in fade-in duration-700'
        )}>
        {children}
      </p>
    );
  }

  //weird bug where all web components are rendered as p
  //web components are objects
  if (typeof children === 'object') {
    return <>{children}</>;
  }

  return (
    <p
      className={cn(
        'leading-1.3 text-size-inherit!',
        showLoader && 'animate-in fade-in duration-700'
      )}>
      {children}
    </p>
  );
};

const headingVariants = cva('leading-1.3', {
  variants: {
    level: {
      1: 'text-3xl ',
      2: 'text-2xl',
      3: 'text-xl',
      4: 'text-lg',
      5: 'text-md',
      6: 'text-sm',
      base: ''
    }
  }
});

export const CustomHeading: React.FC<
  {
    level: 1 | 2 | 3 | 4 | 5 | 6;
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
    numberOfLineMarkdown: number;
    stripFormatting?: boolean;
  } & ExtraPropsExtra
> = ({ level, children, markdown, stripFormatting = false, showLoader, ...rest }) => {
  const HeadingTag = `h${level}` as any;
  return (
    <HeadingTag
      className={cn(
        headingVariants({ level: stripFormatting ? 'base' : level }),
        showLoader && 'animate-in fade-in duration-700'
      )}>
      {children}
    </HeadingTag>
  );
};

export const CustomList: React.FC<
  {
    ordered?: boolean;
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ ordered, children, markdown, showLoader, ...rest }) => {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <ListTag className={cn('leading-1.3', showLoader && 'animate-in fade-in duration-700')}>
      {children}
    </ListTag>
  );
};

export const CustomOrderedList: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <ol
      className={cn(
        'leading-1.3 list-decimal space-y-1',
        showLoader && 'animate-in fade-in duration-700'
      )}>
      {children}
    </ol>
  );
};

export const CustomUnorderedList: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <ul
      className={cn(
        'leading-1.3 mt-1 list-inside list-disc space-y-1',
        showLoader && 'animate-in fade-in duration-700'
      )}>
      {children}
    </ul>
  );
};

export const CustomListItem: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <li
      className={cn(
        'leading-1.3 list-inside space-y-1',
        showLoader && 'animate-in fade-in duration-700'
      )}>
      {children}
    </li>
  );
};

export const CustomBlockquote: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <blockquote className={cn('leading-1.3', showLoader && 'animate-in fade-in duration-700')}>
      {children}
    </blockquote>
  );
};

export const CustomTable: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <table className={cn('leading-1.3', showLoader && 'animate-in fade-in duration-700')}>
      {children}
    </table>
  );
};

export const CustomSpan: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, showLoader, ...rest }) => {
  return (
    <span className={cn('leading-1.3', showLoader && 'animate-in fade-in duration-700')}>
      {children}
    </span>
  );
};
