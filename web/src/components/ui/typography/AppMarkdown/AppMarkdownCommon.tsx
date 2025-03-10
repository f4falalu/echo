import React from 'react';
import { ExtraProps } from 'react-markdown';
import { AppCodeBlock } from '../AppCodeBlock/AppCodeBlock';
import { TextDotLoader } from '@/components/ui/loaders';
import { cva } from 'class-variance-authority';

type Element = any; //TODO fix this after migration

export const commonStreamingCheck = (
  endLine?: number,
  startLine?: number,
  lastTrackedLine?: number
): boolean => {
  const isLineNumber = typeof endLine === 'number' && typeof lastTrackedLine === 'number';
  return isLineNumber && endLine === lastTrackedLine && startLine === lastTrackedLine;
};

export interface ExtraPropsExtra extends ExtraProps {
  numberOfLineMarkdown: number;
}

export const CommonPulseLoader: React.FC<{
  showLoader: boolean;
  numberOfLineMarkdown: number;
  node?: Element;
}> = ({ showLoader, numberOfLineMarkdown, node }) => {
  const showStreamingLoader =
    node &&
    showLoader &&
    commonStreamingCheck(
      node?.position?.end.line,
      node?.position?.start.line,
      numberOfLineMarkdown
    );

  if (showStreamingLoader) {
    return <TextDotLoader />;
  }
  return null;
};

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
  const showStreamingLoader = showLoader && node?.position?.end.line === rest.numberOfLineMarkdown;

  return (
    <AppCodeBlock
      wrapperClassName="my-2.5"
      className="leading-1.3"
      language={language}
      showLoader={showStreamingLoader}>
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
> = ({ children, markdown, ...rest }) => {
  if (Array.isArray(children)) {
    return (
      <p className="leading-1.3">
        {children}
        <CommonPulseLoader {...rest} />
      </p>
    );
  }

  //weird bug where all web components are rendered as p
  //web components are objects
  if (typeof children === 'object') {
    return <>{children}</>;
  }

  return (
    <p className="leading-1.3">
      {children}
      <CommonPulseLoader {...rest} />
    </p>
  );
};

const headingVariants = cva('leading-1.3 my-2', {
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
> = ({ level, children, markdown, stripFormatting = false, ...rest }) => {
  const HeadingTag = `h${level}` as any;
  console.log('heading', HeadingTag, level, children);
  return (
    <HeadingTag className={headingVariants({ level: stripFormatting ? 'base' : level })}>
      {children}
      <CommonPulseLoader {...rest} />
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
> = ({ ordered, children, markdown, ...rest }) => {
  const ListTag = ordered ? 'ol' : 'ul';
  return (
    <ListTag className="leading-1.3">
      {children}
      <CommonPulseLoader {...rest} />
    </ListTag>
  );
};

export const CustomListItem: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, ...rest }) => {
  return (
    <li className="leading-1.3">
      {children}
      <CommonPulseLoader {...rest} />
    </li>
  );
};

export const CustomBlockquote: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, ...rest }) => {
  return (
    <blockquote className="leading-1.3">
      {children}
      <CommonPulseLoader {...rest} />
    </blockquote>
  );
};

export const CustomTable: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, ...rest }) => {
  return (
    <table className="leading-1.3">
      {children}
      <CommonPulseLoader {...rest} />
    </table>
  );
};

export const CustomSpan: React.FC<
  {
    children?: React.ReactNode;
    markdown: string;
    showLoader: boolean;
  } & ExtraPropsExtra
> = ({ children, markdown, ...rest }) => {
  return <span className="leading-1.3">{children}</span>;
};
